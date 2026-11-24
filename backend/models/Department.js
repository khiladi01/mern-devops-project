const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    // Free-text name of the department lead (kept simple on purpose).
    head: { type: String, trim: true, maxlength: 100, default: '' },
  },
  { timestamps: true }
);

// Case-insensitive uniqueness: "engineering" and "Engineering" collide.
departmentSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Department', departmentSchema);
