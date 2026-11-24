export const EMPLOYMENT_STATUSES = [
  { value: 'active', label: 'Active', tone: 'good' },
  { value: 'probation', label: 'Probation', tone: 'info' },
  { value: 'on_leave', label: 'On leave', tone: 'warning' },
  { value: 'terminated', label: 'Terminated', tone: 'critical' },
];

export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present', tone: 'good' },
  { value: 'late', label: 'Late', tone: 'warning' },
  { value: 'absent', label: 'Absent', tone: 'critical' },
];

// Categorical chart palette in its validated, fixed order (see dashboard charts).
export const CHART_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
