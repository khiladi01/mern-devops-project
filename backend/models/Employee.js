const mongoose = require('mongoose');
const Counter = require('./Counter');

const EMPLOYMENT_STATUSES = ['active', 'on_leave', 'probation', 'terminated'];

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true, maxlength: 100 },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    joiningDate: { type: Date, required: true },
    status: { type: String, enum: EMPLOYMENT_STATUSES, default: 'active', index: true },
    profileImage: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

employeeSchema.index({ fullName: 1 });
employeeSchema.index({ joiningDate: 1 });

/** Generates the next sequential employee ID, e.g. EMP-0007. */
employeeSchema.statics.generateEmployeeId = async function generateEmployeeId() {
  const seq = await Counter.next('employee');
  return `EMP-${String(seq).padStart(4, '0')}`;
};

employeeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Employee', employeeSchema);
module.exports.EMPLOYMENT_STATUSES = EMPLOYMENT_STATUSES;
