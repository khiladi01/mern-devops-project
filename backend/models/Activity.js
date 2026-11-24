const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['employee', 'department', 'attendance', 'auth', 'system'],
      required: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 300 },
    actor: { type: String, trim: true, default: 'System' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ createdAt: -1 });

activitySchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Activity', activitySchema);
