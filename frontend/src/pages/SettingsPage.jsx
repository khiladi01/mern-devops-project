import { useState } from 'react';
import { KeyRound, ServerCog, UserRound } from 'lucide-react';
import { authApi } from '../api/services';
import { API_URL, getErrorMessage, getFieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useHealth } from '../hooks/useHealth';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { Field, Input } from '../components/ui/Field';

function ProfileCard() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const unchanged = name.trim() === user?.name;

  const submit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Enter your name (at least 2 characters).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await authApi.updateProfile(name.trim());
      setUser(data.user);
      toast.success('Profile updated.');
    } catch (err) {
      setError(getFieldErrors(err).name || getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Profile" description="How you appear to other admins." />
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={user?.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{user?.name}</p>
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
      </div>
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Full name" htmlFor="profile-name" error={error}>
          <Input id="profile-name" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} invalid={!!error} autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor="profile-email" hint="Your email is your sign-in and can't be changed here.">
          <Input id="profile-email" value={user?.email || ''} disabled readOnly />
        </Field>
        <Button type="submit" loading={saving} disabled={unchanged}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.currentPassword) found.currentPassword = 'Enter your current password.';
    if (!/^(?=.*[A-Za-z])(?=.*\d).{10,128}$/.test(form.newPassword)) {
      found.newPassword = 'Use at least 10 characters, with a letter and a number.';
    }
    if (form.confirm !== form.newPassword) found.confirm = 'The passwords don’t match.';
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      toast.success('Password changed.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setErrors({});
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else if (err.response?.status === 400) setErrors({ currentPassword: getErrorMessage(err) });
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Password" description="Choose a strong password you don't use anywhere else." />
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword}>
          <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set} invalid={!!errors.currentPassword} />
        </Field>
        <Field label="New password" htmlFor="newPassword" error={errors.newPassword} hint="At least 10 characters, with a letter and a number.">
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={set} invalid={!!errors.newPassword} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set} invalid={!!errors.confirm} />
        </Field>
        <Button type="submit" loading={saving}>
          Change password
        </Button>
      </form>
    </Card>
  );
}

const STATUS_TEXT = {
  checking: { label: 'Checking…', tone: 'text-muted' },
  healthy: { label: 'Connected', tone: 'text-good-ink' },
  degraded: { label: 'API running, database unavailable', tone: 'text-warn-ink' },
  offline: { label: 'Unreachable', tone: 'text-critical-ink' },
};

function SystemCard() {
  const status = useHealth(15000);
  const s = STATUS_TEXT[status];
  const rows = [
    { label: 'API address', value: <code className="rounded bg-canvas px-1.5 py-0.5 text-[13px] break-all">{API_URL}</code> },
    { label: 'API status', value: <span className={`font-semibold ${s.tone}`}>{s.label}</span> },
    { label: 'Version', value: <span className="tabular">1.0.0</span> },
  ];
  return (
    <Card>
      <CardHeader title="System" description="Connection details for this deployment." />
      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
            <dt className="text-ink-2">{r.label}</dt>
            <dd className="min-w-0 text-right text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your account and check the system connection." />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ProfileCard />
        <PasswordCard />
        <div className="lg:col-span-2">
          <SystemCard />
        </div>
      </div>
    </>
  );
}
