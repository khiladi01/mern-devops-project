import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { Field, Input, Select } from '../ui/Field';
import { employeesApi } from '../../api/services';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { EMPLOYMENT_STATUSES } from '../../utils/constants';
import { localToday, toInputDate } from '../../utils/format';

const blank = () => ({
  fullName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  joiningDate: localToday(),
  status: 'active',
  profileImage: '',
});

const fromEmployee = (e) => ({
  fullName: e.fullName,
  email: e.email,
  phone: e.phone,
  position: e.position,
  department: e.department?._id || e.department || '',
  joiningDate: toInputDate(e.joiningDate),
  status: e.status,
  profileImage: e.profileImage || '',
});

const validate = (f) => {
  const errors = {};
  if (f.fullName.trim().length < 2) errors.fullName = 'Enter the employee’s full name.';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errors.email = 'Enter a valid email address.';
  if (!/^[0-9+()\-\s]{7,20}$/.test(f.phone.trim())) errors.phone = 'Enter a valid phone number (7-20 digits).';
  if (f.position.trim().length < 2) errors.position = 'Enter the job position.';
  if (!f.department) errors.department = 'Select a department.';
  if (!f.joiningDate) errors.joiningDate = 'Select the joining date.';
  if (f.profileImage.trim() && !/^https?:\/\/\S+$/i.test(f.profileImage.trim())) {
    errors.profileImage = 'Enter a full image URL starting with http:// or https://';
  }
  return errors;
};

export default function EmployeeForm({ open, employee, departments, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(employee);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Reset whenever the dialog opens for a (different) employee.
  useEffect(() => {
    if (open) {
      setForm(employee ? fromEmployee(employee) : blank());
      setErrors({});
    }
  }, [open, employee]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      position: form.position.trim(),
      department: form.department,
      joiningDate: form.joiningDate,
      status: form.status,
      profileImage: form.profileImage.trim(),
    };

    setSaving(true);
    try {
      const saved = isEdit ? await employeesApi.update(employee._id, payload) : await employeesApi.create(payload);
      toast.success(isEdit ? `${saved.fullName} was updated.` : `${saved.fullName} was added as ${saved.employeeId}.`);
      onSaved(saved);
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
      title={isEdit ? 'Edit employee' : 'Add employee'}
      description={isEdit ? `Update the details for ${employee.fullName}.` : 'An employee ID is generated automatically.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add employee'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={submit} noValidate className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        {isEdit && (
          <Field label="Employee ID" htmlFor="employeeId">
            <Input id="employeeId" value={employee.employeeId} disabled readOnly />
          </Field>
        )}
        <Field label="Full name" htmlFor="fullName" required error={errors.fullName} className={isEdit ? '' : 'sm:col-span-2'}>
          <Input id="fullName" name="fullName" value={form.fullName} onChange={set} invalid={!!errors.fullName} placeholder="e.g. Priya Raman" autoComplete="off" />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input id="email" name="email" type="email" value={form.email} onChange={set} invalid={!!errors.email} placeholder="name@company.com" autoComplete="off" />
        </Field>
        <Field label="Phone number" htmlFor="phone" required error={errors.phone}>
          <Input id="phone" name="phone" type="tel" value={form.phone} onChange={set} invalid={!!errors.phone} placeholder="+91 98765 43210" autoComplete="off" />
        </Field>
        <Field label="Job position" htmlFor="position" required error={errors.position}>
          <Input id="position" name="position" value={form.position} onChange={set} invalid={!!errors.position} placeholder="e.g. Senior Backend Engineer" />
        </Field>
        <Field
          label="Department"
          htmlFor="department"
          required
          error={errors.department}
          hint={departments.length === 0 ? undefined : undefined}
        >
          <Select id="department" name="department" value={form.department} onChange={set} invalid={!!errors.department} disabled={departments.length === 0}>
            <option value="">{departments.length ? 'Select a department' : 'No departments yet'}</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </Select>
          {departments.length === 0 && (
            <p className="mt-1.5 text-xs text-muted">
              <Link to="/departments" className="font-semibold text-brand-700 hover:underline">
                Create a department
              </Link>{' '}
              before adding employees.
            </p>
          )}
        </Field>
        <Field label="Joining date" htmlFor="joiningDate" required error={errors.joiningDate}>
          <Input id="joiningDate" name="joiningDate" type="date" value={form.joiningDate} onChange={set} invalid={!!errors.joiningDate} />
        </Field>
        <Field label="Employment status" htmlFor="status" error={errors.status}>
          <Select id="status" name="status" value={form.status} onChange={set}>
            {EMPLOYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Profile image URL"
          htmlFor="profileImage"
          error={errors.profileImage}
          hint="Optional. Initials are shown when there is no image."
          className="sm:col-span-2"
        >
          <div className="flex items-center gap-3">
            <Avatar name={form.fullName || 'New employee'} src={form.profileImage.trim()} size="md" />
            <Input
              id="profileImage"
              name="profileImage"
              type="url"
              value={form.profileImage}
              onChange={set}
              invalid={!!errors.profileImage}
              placeholder="https://…/photo.jpg"
              className="flex-1"
            />
          </div>
        </Field>
      </form>
    </Modal>
  );
}
