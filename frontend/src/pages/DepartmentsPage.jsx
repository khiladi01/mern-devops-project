import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Network, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { departmentsApi } from '../api/services';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Field, Input, Textarea } from '../components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

function DepartmentForm({ open, department, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(department);
  const [form, setForm] = useState({ name: '', head: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: department?.name || '', head: department?.head || '', description: department?.description || '' });
      setErrors({});
    }
  }, [open, department]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) {
      setErrors({ name: 'Enter a department name (at least 2 characters).' });
      return;
    }
    setSaving(true);
    try {
      const payload = { name, head: form.head.trim(), description: form.description.trim() };
      const saved = isEdit ? await departmentsApi.update(department._id, payload) : await departmentsApi.create(payload);
      toast.success(isEdit ? `${saved.name} was updated.` : `${saved.name} was created.`);
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
      title={isEdit ? 'Edit department' : 'Create department'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="department-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Create department'}
          </Button>
        </>
      }
    >
      <form id="department-form" onSubmit={submit} noValidate className="space-y-5">
        <Field label="Department name" htmlFor="name" required error={errors.name}>
          <Input id="name" name="name" value={form.name} onChange={set} invalid={!!errors.name} placeholder="e.g. Customer Success" autoComplete="off" />
        </Field>
        <Field label="Department head" htmlFor="head" error={errors.head} hint="Optional.">
          <Input id="head" name="head" value={form.head} onChange={set} invalid={!!errors.head} placeholder="e.g. Meera Kapoor" autoComplete="off" />
        </Field>
        <Field label="Description" htmlFor="description" error={errors.description} hint="Optional. What does this team do?">
          <Textarea id="description" name="description" value={form.description} onChange={set} invalid={!!errors.description} maxLength={300} />
        </Field>
      </form>
    </Modal>
  );
}

function DepartmentCard({ department, onEdit, onDelete }) {
  const { name, description, head, employeeCount, activeCount } = department;
  return (
    <Card className="flex flex-col transition-shadow duration-200 hover:shadow-pop" padded={false}>
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Network className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="-mt-1 -mr-1.5 flex gap-0.5">
            <button type="button" onClick={() => onEdit(department)} aria-label={`Edit ${name}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-black/5 hover:text-ink">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onDelete(department)} aria-label={`Delete ${name}`} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-critical-tint hover:text-critical-ink">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h2 className="mt-4 text-base font-semibold text-ink">{name}</h2>
        <p className="mt-1 line-clamp-2 min-h-10 text-[13px] leading-5 text-ink-2">{description || 'No description yet.'}</p>

        <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-2">
          <UserRound className="h-4 w-4 text-muted" aria-hidden="true" />
          {head ? (
            <>
              <span className="text-muted">Led by</span> <span className="font-semibold text-ink">{head}</span>
            </>
          ) : (
            <span className="text-muted">No department head</span>
          )}
        </p>
      </div>

      <Link
        to={`/employees?department=${department._id}`}
        className="flex items-center justify-between rounded-b-2xl border-t border-line px-5 py-3.5 transition-colors hover:bg-canvas/70"
      >
        <span className="text-[13px] font-semibold text-brand-700">View employees</span>
        <span className="text-[13px] text-ink-2">
          <span className="tabular text-base font-bold text-ink">{employeeCount}</span> {employeeCount === 1 ? 'employee' : 'employees'}
          {employeeCount > 0 && <span className="text-muted"> · {activeCount} active</span>}
        </span>
      </Link>
    </Card>
  );
}

export default function DepartmentsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => departmentsApi.list(), []);
  const [formState, setFormState] = useState({ open: false, department: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const departments = data || [];

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await departmentsApi.remove(toDelete._id);
      toast.success(`${toDelete.name} was deleted.`);
      setToDelete(null);
      reload();
    } catch (err) {
      // e.g. 409: the department still has employees
      toast.error(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const addButton = (
    <Button icon={Plus} onClick={() => setFormState({ open: true, department: null })}>
      Create department
    </Button>
  );

  return (
    <>
      <PageHeader title="Departments" description="Organise your teams and see how many people are in each." actions={addButton} />

      {error && !data ? (
        <Card padded={false}>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="mt-4 h-5 w-32" />
              <Skeleton className="mt-3 h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon={Network} title="No departments yet" description="Create a department, then assign employees to it." action={addButton} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => (
            <DepartmentCard key={d._id} department={d} onEdit={(department) => setFormState({ open: true, department })} onDelete={setToDelete} />
          ))}
        </div>
      )}

      <DepartmentForm
        open={formState.open}
        department={formState.department}
        onClose={() => setFormState({ open: false, department: null })}
        onSaved={() => {
          setFormState({ open: false, department: null });
          reload();
        }}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete department"
        message={
          toDelete
            ? toDelete.employeeCount > 0
              ? `${toDelete.name} has ${toDelete.employeeCount} ${toDelete.employeeCount === 1 ? 'employee' : 'employees'}, so it can't be deleted. Move or remove them first.`
              : `Delete the ${toDelete.name} department? This can't be undone.`
            : ''
        }
        confirmLabel="Delete department"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
