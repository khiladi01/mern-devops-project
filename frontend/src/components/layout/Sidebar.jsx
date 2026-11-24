import { NavLink } from 'react-router-dom';
import {
  CalendarCheck,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

const MAIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: UsersRound },
  { to: '/departments', label: 'Departments', icon: Network },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
];

function NavItem({ to, label, icon: Icon, end, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-2 hover:bg-black/5 hover:text-ink'
        } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator */}
          <span
            aria-hidden="true"
            className={`absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-brand-600 transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span className={collapsed ? 'lg:sr-only' : ''}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 animate-fade bg-ink/40 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />}

      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-[transform,width] duration-200 ease-out lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } ${mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className={`flex h-16 shrink-0 items-center gap-3 px-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <img src="/favicon.svg" alt="" className="h-8 w-8 shrink-0" />
          <span className={`text-[17px] font-bold tracking-tight text-ink ${collapsed ? 'lg:hidden' : ''}`}>PeopleDesk</span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="scroll-thin flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {MAIN_NAV.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onCloseMobile} />
          ))}

          <div className="mt-auto flex flex-col gap-1 pt-4">
            <div className="mb-2 h-px bg-line" />
            <NavItem to="/settings" label="Settings" icon={Settings} collapsed={collapsed} onNavigate={onCloseMobile} />
            <button
              type="button"
              onClick={logout}
              title={collapsed ? 'Log out' : undefined}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-2 transition-colors hover:bg-critical-tint hover:text-critical-ink ${
                collapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className={collapsed ? 'lg:sr-only' : ''}>Logout</span>
            </button>
          </div>
        </nav>

        {/* Admin profile + collapse control */}
        <div className="shrink-0 border-t border-line p-3">
          <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? 'lg:justify-center lg:p-0' : ''}`}>
            <Avatar name={user?.name} size="md" />
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className={`mt-2 hidden h-9 w-full items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-muted transition-colors hover:bg-black/5 hover:text-ink lg:flex ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
