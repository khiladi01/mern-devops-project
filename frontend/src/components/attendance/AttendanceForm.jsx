import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { attendanceApi, employeesApi } from '../../api/services';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ATTENDANCE_STATUSES } from '../../utils/constants';
import { formatDate, nowTime } from '../../utils/format';

const blank = (date) => ({ employee: '', date, status: 'present', checkIn: '09:00', checkOut: '', notes: '' });

export default function AttendanceForm({ open, record, defaultDate, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(record);
  const [form, setForm] = useState(() => blank(defaultDate));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (record) {
      setForm({
        employee: record.employee._id,
        date: record.date,
        status: record.status,
        checkIn: record.checkIn || '',
        checkOut: record.checkOut || '',
        notes: record.notes || '',
      });
    } else {
      setForm(blank(defaultDate));
    }
  }, [open, record, defaultDate]);

  // Employee list for the picker (only needed when creating; terminated staff are excluded).
  useEffect(() => {
    if (!open || isEdit) return undefined;
    let cancelled = false;
    setLoadingEmployees(true);
    employeesApi
      .options()
      .then((list) => !cancelled && setEmployees(list.filter((e) => e.status !== 'terminated')))
      .catch((err) => !cancelled && toast.error(getErrorMessage(err)))
      .finally(() => !cancelled && setLoadingEmployees(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  const absent = form.status === 'absent';

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      // Sensible defaults when switching status.
      if (name === 'status') {
        if (value === 'absent') return { ...next, checkIn: '', checkOut: '' };
        if (!f.checkIn) return { ...next, checkIn: nowTime() };
      }
      return next;
    });
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const found = {};
    if (!form.employee) found.employee = 'Select an employee.';
    if (!form.date) found.date = 'Select a date.';
    if (!absent) {
      if (!form.checkIn) found.checkIn = 'Enter the check-in time.';
      else if (form.checkOut && form.checkOut <= form.checkIn) found.checkOut = 'Check-out must be later than check-in.';
    }
    return found;
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const payload = {
      status: form.status,
      checkIn: absent ? null : form.checkIn || null,
      checkOut: absent ? null : form.checkOut || null,
      notes: form.notes.trim(),
    };
    setSaving(true);
    try {
      if (isEdit) await attendanceApi.update(record._id, payload);
      else await attendanceApi.create({ ...payload, employee: form.employee, date: form.date });
      toast.success(isEdit ? 'Attendance updated.' : 'Attendance recorded.');
      onSaved();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Edit attendance' : 'Record attendance'}
      description={isEdit ? `${record.employee.fullName} · ${formatDate(record.date)}` : 'Mark an employee present, late or absent for a day.'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="attendance-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Record attendance'}
          </Button>
        </>
      }
    >
      <form id="attendance-form" onSubmit={submit} noValidate className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        {!isEdit && (
          <Field label="Employee" htmlFor="employee" required error={errors.employee} className="sm:col-span-2">
            <Select id="employee" name="employee" value={form.employee} onChange={set} invalid={!!errors.employee} disabled={loadingEmployees}>
              <option value="">{loadingEmployees ? 'Loading employees…' : 'Select an employee'}</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.employeeId})
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Date" htmlFor="date" required error={errors.date}>
          <Input id="date" name="date" type="date" value={form.date} onChange={set} invalid={!!errors.date} disabled={isEdit} />
        </Field>
        <Field label="Status" htmlFor="status" required error={errors.status}>
          <Select id="status" name="status" value={form.status} onChange={set}>
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Check-in time" htmlFor="checkIn" required={!absent} error={errors.checkIn}>
          <Input id="checkIn" name="checkIn" type="time" value={form.checkIn} onChange={set} invalid={!!errors.checkIn} disabled={absent} />
        </Field>
        <Field label="Check-out time" htmlFor="checkOut" error={errors.checkOut} hint={absent ? undefined : 'Leave empty if they are still working.'}>
          <Input id="checkOut" name="checkOut" type="time" value={form.checkOut} onChange={set} invalid={!!errors.checkOut} disabled={absent} />
        </Field>
        <Field label="Notes" htmlFor="notes" error={errors.notes} className="sm:col-span-2">
          <Textarea id="notes" name="notes" value={form.notes} onChange={set} invalid={!!errors.notes} maxLength={300} rows={2} placeholder="Optional, e.g. working from home" />
        </Field>
      </form>
    </Modal>
  );
}
