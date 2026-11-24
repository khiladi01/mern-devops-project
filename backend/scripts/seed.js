/**
 * Seeds the database with realistic demo data (departments, employees,
 * two weeks of attendance and an activity feed).
 *
 *   npm run seed            # seeds only when the database has no employees
 *   npm run seed -- --force # wipes departments/employees/attendance/activity first
 *
 * Admin accounts are never touched or created with hardcoded credentials -
 * create one with `npm run create-admin` or ADMIN_EMAIL / ADMIN_PASSWORD.
 */
const mongoose = require('mongoose');
const config = require('../config');

config.validate();

const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const Counter = require('../models/Counter');
const ensureAdmin = require('../utils/bootstrapAdmin');
const { todayString, addDays } = require('../utils/date');

// Small deterministic PRNG so every seed run produces the same dataset.
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(20240607);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p) => rand() < p;
const pad = (n) => String(n).padStart(2, '0');
const time = (h, m) => `${pad(h)}:${pad(m)}`;

const DEPARTMENTS = [
  { name: 'Engineering', head: 'Priya Raman', description: 'Product development, platform and infrastructure.' },
  { name: 'Human Resources', head: 'Meera Kapoor', description: 'Recruitment, onboarding, culture and employee relations.' },
  { name: 'Marketing', head: 'Daniel Foster', description: 'Brand, content, campaigns and growth marketing.' },
  { name: 'Finance', head: 'Ananya Iyer', description: 'Accounting, payroll, budgeting and compliance.' },
  { name: 'Operations', head: 'Marcus Webb', description: 'Business operations, facilities and vendor management.' },
];

// [name, gender, position, department index]
const PEOPLE = [
  ['Priya Raman', 'f', 'VP of Engineering', 0],
  ['Arjun Mehta', 'm', 'Senior Backend Engineer', 0],
  ['Sofia Lindqvist', 'f', 'Frontend Engineer', 0],
  ['Rahul Verma', 'm', 'DevOps Engineer', 0],
  ['Chloe Bennett', 'f', 'QA Engineer', 0],
  ['Kabir Malhotra', 'm', 'Full Stack Developer', 0],
  ['Nina Petrova', 'f', 'Engineering Manager', 0],
  ['Omar Haddad', 'm', 'Site Reliability Engineer', 0],
  ['Isha Nair', 'f', 'Software Engineer', 0],
  ['Lucas Moreau', 'm', 'Mobile Developer', 0],
  ['Tanvi Joshi', 'f', 'Data Engineer', 0],
  ['Ethan Clarke', 'm', 'Software Engineer', 0],
  ['Meera Kapoor', 'f', 'Head of People', 1],
  ['Jordan Ellis', 'm', 'HR Business Partner', 1],
  ['Aisha Khan', 'f', 'Talent Acquisition Lead', 1],
  ['Sam Rivera', 'm', 'HR Generalist', 1],
  ['Leah Cohen', 'f', 'Recruiter', 1],
  ['Vikram Singh', 'm', 'People Operations Analyst', 1],
  ['Daniel Foster', 'm', 'Marketing Director', 2],
  ['Hannah Weber', 'f', 'Content Strategist', 2],
  ['Rohan Desai', 'm', 'Performance Marketer', 2],
  ['Grace Okafor', 'f', 'Brand Designer', 2],
  ['Tomas Silva', 'm', 'SEO Specialist', 2],
  ['Kavya Reddy', 'f', 'Social Media Manager', 2],
  ['Ananya Iyer', 'f', 'Finance Controller', 3],
  ['Mateo Fernandez', 'm', 'Financial Analyst', 3],
  ['Emily Zhang', 'f', 'Accountant', 3],
  ['Siddharth Rao', 'm', 'Payroll Specialist', 3],
  ['Olivia Grant', 'f', 'Accounts Payable Lead', 3],
  ['Farhan Ali', 'm', 'Budget Analyst', 3],
  ['Marcus Webb', 'm', 'Operations Manager', 4],
  ['Neha Gupta', 'f', 'Operations Coordinator', 4],
  ['Liam Nguyen', 'm', 'Facilities Manager', 4],
  ['Zara Hussain', 'f', 'Vendor Relations Specialist', 4],
  ['Aditya Bhat', 'm', 'Logistics Analyst', 4],
  ['Maya Thompson', 'f', 'Office Administrator', 4],
  ['Noah Fischer', 'm', 'Process Improvement Lead', 4],
  ['Riya Sharma', 'f', 'Business Analyst', 4],
  ['Kenji Tanaka', 'm', 'Security Engineer', 0],
  ['Amelia Brooks', 'f', 'Product Designer', 0],
];

const slug = (name) => name.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.');
const isWeekend = (dateStr) => [0, 6].includes(new Date(`${dateStr}T00:00:00Z`).getUTCDay());

const wipe = async () => {
  await Promise.all([
    Department.deleteMany({}),
    Employee.deleteMany({}),
    Attendance.deleteMany({}),
    Activity.deleteMany({}),
    Counter.deleteMany({}),
  ]);
};

const main = async () => {
  const force = process.argv.includes('--force');
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });

  const existing = await Employee.estimatedDocumentCount();
  if (existing > 0 && !force) {
    console.log(`Database already contains ${existing} employees. Re-run with --force to wipe and re-seed.`);
    return;
  }
  if (force) {
    console.log('Clearing existing departments, employees, attendance and activity...');
    await wipe();
    // Indexes (unique, collation) must exist before inserting.
  }
  await Promise.all([Department.init(), Employee.init(), Attendance.init()]);

  const today = todayString();
  const todayDate = new Date(`${today}T09:00:00Z`);

  /* Departments */
  const departments = await Department.insertMany(DEPARTMENTS);

  /* Employees: most joined recently so the growth chart tells a story */
  const employees = [];
  for (const [i, [fullName, gender, position, deptIdx]] of PEOPLE.entries()) {
    const terminated = fullName === 'Chloe Bennett' || fullName === 'Farhan Ali';
    // Early hires first, terminated people must have been around for a while.
    const daysAgo = Math.floor(Math.pow(rand(), 1.6) * 700) + (i < 6 ? 120 : 0) + (terminated ? 260 : 0);
    const joining = new Date(todayDate);
    joining.setUTCDate(joining.getUTCDate() - daysAgo);

    let status = 'active';
    if (daysAgo < 75 && chance(0.55)) status = 'probation';
    else if (chance(0.08)) status = 'on_leave';
    if (terminated) status = 'terminated';

    const photoId = (i * 7) % 90;
    employees.push({
      employeeId: await Employee.generateEmployeeId(),
      fullName,
      email: `${slug(fullName)}@peopledesk.example`,
      phone: `+91 9${randInt(1000, 9999)} ${randInt(10000, 99999)}`,
      position,
      department: departments[deptIdx]._id,
      joiningDate: joining,
      status,
      profileImage: `https://randomuser.me/api/portraits/${gender === 'f' ? 'women' : 'men'}/${photoId}.jpg`,
      createdAt: joining,
      updatedAt: joining,
    });
  }
  const savedEmployees = await Employee.insertMany(employees);
  console.log(`Inserted ${departments.length} departments and ${savedEmployees.length} employees.`);

  /* Attendance: last 14 days (weekdays + today) */
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).filter(
    (d) => d === today || !isWeekend(d)
  );
  const records = [];
  for (const emp of savedEmployees) {
    if (emp.status === 'terminated') continue;
    for (const date of days) {
      if (new Date(`${date}T23:59:59Z`) < emp.joiningDate) continue;
      if (date === today && chance(0.1)) continue; // leave a few "not marked yet" today

      let status = 'present';
      if (emp.status === 'on_leave') status = 'absent';
      else if (chance(0.07)) status = 'absent';
      else if (chance(0.1)) status = 'late';

      const record = { employee: emp._id, date, status, checkIn: null, checkOut: null, notes: '' };
      if (status === 'present') {
        record.checkIn = time(randInt(8, 9), status === 'present' ? randInt(0, 25) : 0);
      } else if (status === 'late') {
        record.checkIn = time(randInt(9, 10), randInt(31, 59));
        record.notes = 'Arrived late';
      } else {
        record.notes = emp.status === 'on_leave' ? 'On approved leave' : chance(0.5) ? 'Sick leave' : '';
      }
      if (record.checkIn && date !== today) record.checkOut = time(randInt(17, 18), randInt(0, 59));
      records.push(record);
    }
  }
  await Attendance.insertMany(records);
  console.log(`Inserted ${records.length} attendance records across ${days.length} days.`);

  /* Activity feed */
  const newest = [...savedEmployees].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);
  const activities = [
    ...newest.map((e, i) => ({
      type: 'employee',
      message: `${e.fullName} was added as ${e.position}`,
      actor: 'Admin',
      createdAt: hoursAgo(3 + i * 9),
    })),
    { type: 'attendance', message: `Attendance for ${today} was marked for the team`, actor: 'Admin', createdAt: hoursAgo(1) },
    { type: 'department', message: 'Department "Operations" was updated', actor: 'Admin', createdAt: hoursAgo(30) },
    { type: 'employee', message: "Kabir Malhotra's profile was updated", actor: 'Admin', createdAt: hoursAgo(52) },
    { type: 'system', message: 'Demo data was loaded', actor: 'System', createdAt: hoursAgo(80) },
  ];
  await Activity.insertMany(activities);

  await ensureAdmin();
  console.log('Seeding complete.');
};

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
