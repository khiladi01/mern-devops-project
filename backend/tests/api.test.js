/**
 * Integration tests - they run the real Express app against a real MongoDB.
 *
 *   npm test
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27017/peopledesk_test npm test
 *
 * The target database is dropped at the end, so never point this at real data.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123456';
process.env.BCRYPT_ROUNDS = '4';
process.env.MONGO_URI =
  process.env.TEST_MONGO_URI || `mongodb://127.0.0.1:27017/peopledesk_test_${process.pid}`;
process.env.APP_TIMEZONE = 'UTC';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const app = require('../app');
const Admin = require('../models/Admin');

const ADMIN = { name: 'Test Admin', email: 'admin@test.example', password: 'Correct-Horse-9' };
let server;
let base;
let token;

const call = async (method, path, body, auth = token) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(auth ? { authorization: `Bearer ${auth}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};

before(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  await Admin.create(ADMIN);
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test('health endpoints respond without authentication', async () => {
  const live = await call('GET', '/api/health', null, null);
  assert.equal(live.status, 200);
  assert.equal(live.body.status, 'ok');
  const ready = await call('GET', '/health/ready', null, null);
  assert.equal(ready.status, 200);
  assert.equal(ready.body.database, 'connected');
});

test('protected routes reject missing and invalid tokens', async () => {
  assert.equal((await call('GET', '/api/employees', null, null)).status, 401);
  assert.equal((await call('GET', '/api/employees', null, 'not.a.jwt')).status, 401);
  assert.equal((await call('GET', '/api/dashboard/stats', null, null)).status, 401);
});

test('login validates input, rejects bad credentials and returns a JWT', async () => {
  assert.equal((await call('POST', '/api/auth/login', { email: 'nope' }, null)).status, 422);
  const wrong = await call('POST', '/api/auth/login', { email: ADMIN.email, password: 'wrong' }, null);
  assert.equal(wrong.status, 401);
  const unknown = await call('POST', '/api/auth/login', { email: 'who@test.example', password: 'x' }, null);
  assert.equal(unknown.status, 401);
  assert.equal(unknown.body.message, wrong.body.message, 'must not reveal which emails exist');

  const ok = await call('POST', '/api/auth/login', { email: ADMIN.email.toUpperCase(), password: ADMIN.password }, null);
  assert.equal(ok.status, 200);
  assert.ok(ok.body.data.token);
  assert.equal(ok.body.data.user.password, undefined, 'password hash must never be returned');
  token = ok.body.data.token;

  const stored = await Admin.findOne({ email: ADMIN.email }).select('+password');
  assert.notEqual(stored.password, ADMIN.password);
  assert.match(stored.password, /^\$2[aby]\$/, 'password is stored as a bcrypt hash');

  const me = await call('GET', '/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, ADMIN.email);
});

let engineering;
let employee;

test('departments: create, validate, duplicate, update, list with counts', async () => {
  assert.equal((await call('POST', '/api/departments', { name: 'x' })).status, 422);

  const created = await call('POST', '/api/departments', { name: 'Engineering', description: 'Builds things', head: 'Ada' });
  assert.equal(created.status, 201);
  engineering = created.body.data;

  const dup = await call('POST', '/api/departments', { name: 'engineering' });
  assert.equal(dup.status, 409, 'names are unique case-insensitively');

  const updated = await call('PUT', `/api/departments/${engineering._id}`, { description: 'Platform & product' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.description, 'Platform & product');

  assert.equal((await call('PUT', '/api/departments/not-an-id', { name: 'Abc' })).status, 422);
  assert.equal((await call('PUT', '/api/departments/64b7f0f0f0f0f0f0f0f0f0f0', { name: 'Abc' })).status, 404);

  const list = await call('GET', '/api/departments');
  assert.equal(list.status, 200);
  assert.equal(list.body.data[0].employeeCount, 0);
});

test('employees: validation, create with generated ID, duplicate email', async () => {
  const bad = await call('POST', '/api/employees', { fullName: 'A', email: 'bad', department: 'nope' });
  assert.equal(bad.status, 422);
  assert.ok(bad.body.errors.some((e) => e.field === 'email'));

  const payload = {
    fullName: 'Grace Hopper',
    email: 'Grace@Example.com',
    phone: '+1 555 010 1234',
    position: 'Staff Engineer',
    department: engineering._id,
    joiningDate: '2025-03-14',
    status: 'active',
  };
  const created = await call('POST', '/api/employees', payload);
  assert.equal(created.status, 201);
  employee = created.body.data;
  assert.match(employee.employeeId, /^EMP-\d{4}$/);
  assert.equal(employee.email, 'grace@example.com');
  assert.equal(employee.department.name, 'Engineering');

  const dup = await call('POST', '/api/employees', { ...payload, fullName: 'Someone Else' });
  assert.equal(dup.status, 409);
  assert.match(dup.body.message, /already exists/i);

  const ghostDept = await call('POST', '/api/employees', { ...payload, email: 'x@example.com', department: '64b7f0f0f0f0f0f0f0f0f0f0' });
  assert.equal(ghostDept.status, 400);
});

test('employees: list supports search, filters, pagination and resists operator injection', async () => {
  for (let i = 1; i <= 12; i += 1) {
    const r = await call('POST', '/api/employees', {
      fullName: `Test Person ${i}`,
      email: `person${i}@example.com`,
      phone: '9876543210',
      position: i % 2 ? 'Developer' : 'Designer',
      department: engineering._id,
      joiningDate: '2026-01-10',
      status: i > 10 ? 'on_leave' : 'active',
    });
    assert.equal(r.status, 201);
  }

  const page1 = await call('GET', '/api/employees?limit=5&page=1');
  assert.equal(page1.body.data.length, 5);
  assert.equal(page1.body.pagination.total, 13);
  assert.equal(page1.body.pagination.pages, 3);

  const search = await call('GET', '/api/employees?search=grace');
  assert.equal(search.body.pagination.total, 1);
  const regexChars = await call('GET', '/api/employees?search=' + encodeURIComponent('.*('));
  assert.equal(regexChars.status, 200);
  assert.equal(regexChars.body.pagination.total, 0);

  const byStatus = await call('GET', '/api/employees?status=on_leave');
  assert.equal(byStatus.body.pagination.total, 2);
  const byDept = await call('GET', `/api/employees?department=${engineering._id}`);
  assert.equal(byDept.body.pagination.total, 13);

  // Express 5 doesn't parse "status[$ne]" into an object, so the operator is inert:
  // a $ne filter would have returned only the 2 on-leave people; we expect all 13.
  const inject = await call('GET', '/api/employees?status[$ne]=active');
  assert.equal(inject.body.pagination.total, 13);
  const injectNested = await call('GET', '/api/employees?search[$regex]=.*');
  assert.equal(injectNested.status, 200);
  assert.equal(injectNested.body.pagination.total, 13, 'operator-style search keys are ignored, not executed');

  const options = await call('GET', '/api/employees/options');
  assert.equal(options.status, 200);
  assert.equal(options.body.data.length, 13);
});

test('employees: read, update, 404s', async () => {
  const one = await call('GET', `/api/employees/${employee._id}`);
  assert.equal(one.status, 200);
  assert.equal(one.body.data.fullName, 'Grace Hopper');

  const upd = await call('PUT', `/api/employees/${employee._id}`, { position: 'Distinguished Engineer', status: 'probation' });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.data.position, 'Distinguished Engineer');
  assert.equal(upd.body.data.employeeId, employee.employeeId, 'employee ID is immutable');

  assert.equal((await call('PUT', `/api/employees/${employee._id}`, { email: 'person1@example.com' })).status, 409);
  assert.equal((await call('GET', '/api/employees/64b7f0f0f0f0f0f0f0f0f0f0')).status, 404);
  assert.equal((await call('GET', '/api/employees/abc')).status, 422);
});

test('attendance: record, prevent duplicates, validate times, update, filter', async () => {
  const rec = {
    employee: employee._id,
    date: '2026-06-01',
    status: 'present',
    checkIn: '09:05',
    checkOut: '17:30',
  };
  const created = await call('POST', '/api/attendance', rec);
  assert.equal(created.status, 201);
  assert.equal(created.body.data.employee.fullName, 'Grace Hopper');

  assert.equal((await call('POST', '/api/attendance', rec)).status, 409);
  assert.equal((await call('POST', '/api/attendance', { ...rec, date: '2026-06-02', checkIn: '25:99' })).status, 422);
  assert.equal((await call('POST', '/api/attendance', { ...rec, date: '2026-06-02', checkIn: '10:00', checkOut: '09:00' })).status, 422);
  assert.equal((await call('POST', '/api/attendance', { ...rec, date: '2026-06-02', checkIn: undefined })).status, 422, 'present needs check-in');
  assert.equal((await call('POST', '/api/attendance', { ...rec, date: '2026-02-30' })).status, 422);

  const absent = await call('POST', '/api/attendance', { employee: employee._id, date: '2026-06-02', status: 'absent', checkIn: '09:00' });
  assert.equal(absent.status, 201);
  assert.equal(absent.body.data.checkIn, null, 'absent records carry no times');

  const upd = await call('PUT', `/api/attendance/${created.body.data._id}`, { status: 'late', checkIn: '09:45' });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.data.status, 'late');

  const day = await call('GET', '/api/attendance?date=2026-06-01');
  assert.equal(day.body.data.length, 1);
  assert.equal(day.body.summary.late, 1);
  const range = await call('GET', '/api/attendance?from=2026-06-01&to=2026-06-30');
  assert.equal(range.body.pagination.total, 2);
  const filtered = await call('GET', `/api/attendance?employee=${employee._id}&status=absent`);
  assert.equal(filtered.body.pagination.total, 1);
  assert.equal(filtered.body.summary.late, 1, 'summary ignores the status filter');
});

test('dashboard stats return totals, growth, distribution, attendance and activity', async () => {
  await call('POST', '/api/attendance', { employee: employee._id, date: '2026-07-01', status: 'present', checkIn: '09:00' });
  const res = await call('GET', '/api/dashboard/stats?today=2026-07-01');
  assert.equal(res.status, 200);
  const d = res.body.data;
  assert.equal(d.totals.employees, 13);
  assert.equal(d.totals.departments, 1);
  assert.equal(d.totals.presentToday, 1);
  assert.equal(d.growth.length, 12);
  assert.equal(d.growth.at(-1).total, 13);
  assert.equal(d.departmentDistribution[0].name, 'Engineering');
  assert.equal(d.attendance.last7Days.length, 7);
  assert.equal(d.attendance.today.present, 1);
  assert.ok(d.recentEmployees.length > 0);
  assert.ok(d.recentActivity.length > 0);
  assert.equal((await call('GET', '/api/dashboard/stats?today=banana')).status, 422);
});

test('departments cannot be deleted while they have employees', async () => {
  const blocked = await call('DELETE', `/api/departments/${engineering._id}`);
  assert.equal(blocked.status, 409);
  assert.match(blocked.body.message, /13 employees/);
});

test('deleting an employee also removes their attendance', async () => {
  const del = await call('DELETE', `/api/employees/${employee._id}`);
  assert.equal(del.status, 200);
  assert.equal((await call('GET', `/api/employees/${employee._id}`)).status, 404);
  const att = await call('GET', `/api/attendance?employee=${employee._id}`);
  assert.equal(att.body.pagination.total, 0);
});

test('an empty department can be deleted', async () => {
  const empty = await call('POST', '/api/departments', { name: 'Temp' });
  const del = await call('DELETE', `/api/departments/${empty.body.data._id}`);
  assert.equal(del.status, 200);
});

test('profile and password changes', async () => {
  assert.equal((await call('PUT', '/api/auth/me', { name: 'Renamed Admin' })).body.data.user.name, 'Renamed Admin');
  assert.equal((await call('PUT', '/api/auth/password', { currentPassword: 'wrong', newPassword: 'Another-Pass-77' })).status, 400);
  assert.equal((await call('PUT', '/api/auth/password', { currentPassword: ADMIN.password, newPassword: 'short1' })).status, 422);
  assert.equal((await call('PUT', '/api/auth/password', { currentPassword: ADMIN.password, newPassword: 'Another-Pass-77' })).status, 200);

  const relogin = await call('POST', '/api/auth/login', { email: ADMIN.email, password: 'Another-Pass-77' }, null);
  assert.equal(relogin.status, 200);
});

test('unknown routes and malformed JSON return clean errors', async () => {
  const nf = await call('GET', '/api/nope');
  assert.equal(nf.status, 404);
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
  assert.equal(res.status, 400);
});
