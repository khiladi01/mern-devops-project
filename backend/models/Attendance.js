const mongoose = require('mongoose');

const ATTENDANCE_STATUSES = ['present', 'late', 'absent'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    // Stored as YYYY-MM-DD so a "day" is unambiguous regardless of timezone.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
    checkIn: {
      type: String,
      match: [TIME_RE, 'Check-in must be in HH:mm format'],
      default: null,
    },
    checkOut: {
      type: String,
      match: [TIME_RE, 'Check-out must be in HH:mm format'],
      default: null,
    },
    notes: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

// One record per employee per day.
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.pre('validate', function normalise() {
  if (this.status === 'absent') {
    this.checkIn = null;
    this.checkOut = null;
  } else if (!this.checkIn) {
    this.invalidate('checkIn', 'Check-in time is required for present or late records');
  }
  if (this.checkIn && this.checkOut && this.checkOut <= this.checkIn) {
    this.invalidate('checkOut', 'Check-out must be later than check-in');
  }
});

attendanceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
module.exports.ATTENDANCE_STATUSES = ATTENDANCE_STATUSES;
module.exports.TIME_RE = TIME_RE;
