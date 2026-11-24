import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, Eye, EyeOff, Lock, Mail, Network, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';

const HIGHLIGHTS = [
  { icon: UsersRound, text: 'Keep every employee record in one place' },
  { icon: Network, text: 'See how departments are staffed at a glance' },
  { icon: CalendarCheck, text: 'Track daily attendance and check-in times' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="h-9 w-9" />
          <span className="text-xl font-bold tracking-tight">PeopleDesk</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl leading-[1.15] font-bold tracking-tight">Run your people operations without the spreadsheets.</h1>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5 text-[15px] text-brand-100">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[13px] text-brand-200">PeopleDesk employee management</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/favicon.svg" alt="" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight">PeopleDesk</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-ink">Sign in</h2>
          <p className="mt-1.5 text-sm text-ink-2">Use your administrator account to continue.</p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="rounded-xl border border-critical/25 bg-critical-tint px-4 py-3 text-sm font-medium text-critical-ink">
                {error}
              </div>
            )}

            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                icon={Mail}
                placeholder="you@company.com"
                value={form.email}
                onChange={update}
                autoFocus
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={update}
                  className="h-10 w-full rounded-xl border border-line-strong bg-surface pr-11 pl-10 text-sm text-ink transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-black/5 hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Button type="submit" loading={submitting} className="w-full">
              Sign in
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
