const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, maxlength: 40, default: 'General' },
    image: { type: String, trim: true, maxlength: 500, default: '' },
    stock: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
