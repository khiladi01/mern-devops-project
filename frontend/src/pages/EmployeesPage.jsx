import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Plus, Search, Trash2, UsersRound, X } from 'lucide-react';
import { departmentsApi, employeesApi } from '../api/services';
import { getErrorMessage } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';
import { EMPLOYMENT_STATUSES } from '../utils/constants';
import { formatDate } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { EmploymentBadge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Field';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/States';
import EmployeeForm from '../components/employees/EmployeeForm';

const PAGE_SIZE = 10;

function SortHeader({ label, field, sortBy, order, onSort, className = '' }) {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'} className={`px-5 py-3 font-semibold ${className}`}>
      <button type="button" onClick={() => onSort(field)} className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:text-ink">
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? 'text-brand-600' : 'text-muted/70'}`} aria-hidden="true" />
      </button>
    </th>
  );
}

function RowActions({ employee, onEdit, onDelete }) {
  const base = 'grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors';
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link to={`/employees/${employee._id}`} className={`${base} hover:bg-black/5 hover:text-ink`} aria-label={`View ${employee.fullName}`} title="View profile">
        <Eye className="h-4 w-4" />
      </Link>
      <button type="button" onClick={() => onEdit(employee)} className={`${base} hover:bg-black/5 hover:text-ink`} aria-label={`Edit ${employee.fullName}`} title="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onDelete(employee)} className={`${base} hover:bg-critical-tint hover:text-critical-ink`} aria-label={`Delete ${employee.fullName}`} title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function EmployeesPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  // Filters live in the URL so a filtered view can be bookmarked or shared.
  const department = params.get('department') || '';
  const status = params.get('status') || '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const sortBy = params.get('sortBy') || 'created';
  const order = params.get('order') || 'desc';

  const [searchText, setSearchText] = useState(params.get('search') || '');
  const search = useDebounce(searchText.trim(), 350);

  const patchParams = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Push the debounced search into the URL (and go back to page 1).
  useEffect(() => {
    if (search !== (params.get('search') || '')) patchParams({ search, page: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data: departments } = useFetch(() => departmentsApi.list(), []);
  const { data, loading, error, reload } = useFetch(
    () => employeesApi.list({ page, limit: PAGE_SIZE, search: params.get('search') || undefined, department: department || undefined, status: status || undefined, sortBy, order }),
    [page, params.get('search'), department, status, sortBy, order]
  );

  const rows = data?.data || [];
  const pagination = data?.pagination;
  const hasFilters = Boolean(department || status || params.get('search'));

  const [formState, setFormState] = useState({ open: false, employee: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onSort = (field) => {
    if (sortBy === field) patchParams({ order: order === 'asc' ? 'desc' : 'asc', page: '' });
    else patchParams({ sortBy: field, order: 'asc', page: '' });
  };

  const clearFilters = () => {
    setSearchText('');
    setParams({}, { replace: true });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await employeesApi.remove(toDelete._id);
      toast.success(`${toDelete.fullName} was deleted.`);
      setToDelete(null);
      // Don't strand the user on a page that no longer exists.
      if (rows.length === 1 && page > 1) patchParams({ page: String(page - 1) });
      else reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const departmentOptions = departments || [];

  return (
    <>
      <PageHeader
        title="Employees"
        description="Search, filter and manage everyone in your organisation."
        actions={
          <Button icon={Plus} onClick={() => setFormState({ open: true, employee: null })}>
            Add employee
          </Button>
        }
      />

      <Card padded={false}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5 lg:flex-row lg:items-center">
          <Input
            icon={Search}
            type="search"
            aria-label="Search employees"
            placeholder="Search by name, email, ID or position"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="lg:max-w-sm lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <Select aria-label="Filter by department" value={department} onChange={(e) => patchParams({ department: e.target.value, page: '' })} className="lg:w-52">
              <option value="">All departments</option>
              {departmentOptions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by status" value={status} onChange={(e) => patchParams({ status: e.target.value, page: '' })} className="lg:w-44">
              <option value="">All statuses</option>
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={clearFilters} className="self-start lg:self-auto">
              Clear filters
            </Button>
          )}
        </div>

        {/* Content */}
        {error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <TableSkeleton rows={PAGE_SIZE} cols={6} />
        ) : rows.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="No employees match these filters"
              description="Try a different search term or clear the filters."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={UsersRound}
              title="No employees yet"
              description="Add your first employee to start building your directory."
              action={
                <Button icon={Plus} onClick={() => setFormState({ open: true, employee: null })}>
                  Add employee
                </Button>
              }
            />
          )
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-line bg-canvas/60 text-[13px] text-ink-2">
                  <tr>
                    <SortHeader label="Employee" field="name" sortBy={sortBy} order={order} onSort={onSort} />
                    <SortHeader label="ID" field="employeeId" sortBy={sortBy} order={order} onSort={onSort} />
                    <th scope="col" className="px-5 py-3 font-semibold">Position</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Department</th>
                    <SortHeader label="Joined" field="joined" sortBy={sortBy} order={order} onSort={onSort} />
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((e) => (
                    <tr key={e._id} className="transition-colors hover:bg-canvas/60">
                      <td className="px-5 py-3.5">
                        <Link to={`/employees/${e._id}`} className="group flex items-center gap-3">
                          <Avatar name={e.fullName} src={e.profileImage} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink group-hover:text-brand-700">{e.fullName}</span>
                            <span className="block truncate text-[13px] text-muted">{e.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="tabular px-5 py-3.5 whitespace-nowrap text-ink-2">{e.employeeId}</td>
                      <td className="px-5 py-3.5 text-ink-2">{e.position}</td>
                      <td className="px-5 py-3.5 text-ink-2">{e.department?.name || '-'}</td>
                      <td className="tabular px-5 py-3.5 whitespace-nowrap text-ink-2">{formatDate(e.joiningDate)}</td>
                      <td className="px-5 py-3.5"><EmploymentBadge status={e.status} /></td>
                      <td className="px-3 py-3.5">
                        <RowActions employee={e} onEdit={(emp) => setFormState({ open: true, employee: emp })} onDelete={setToDelete} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((e) => (
                <li key={e._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={e.fullName} src={e.profileImage} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/employees/${e._id}`} className="block truncate font-semibold text-ink">{e.fullName}</Link>
                      <p className="truncate text-[13px] text-muted">{e.position} · {e.department?.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <EmploymentBadge status={e.status} />
                        <span className="tabular text-xs text-muted">{e.employeeId}</span>
                      </div>
                    </div>
                    <RowActions employee={e} onEdit={(emp) => setFormState({ open: true, employee: emp })} onDelete={setToDelete} />
                  </div>
                </li>
              ))}
            </ul>

            {pagination && (
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={pagination.limit}
                onChange={(p) => patchParams({ page: p > 1 ? String(p) : '' })}
              />
            )}
          </div>
        )}
      </Card>

      <EmployeeForm
        open={formState.open}
        employee={formState.employee}
        departments={departmentOptions}
        onClose={() => setFormState({ open: false, employee: null })}
        onSaved={() => {
          setFormState({ open: false, employee: null });
          reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete employee"
        message={toDelete ? `Delete ${toDelete.fullName} (${toDelete.employeeId})? Their attendance history will be removed too. This can't be undone.` : ''}
        confirmLabel="Delete employee"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
