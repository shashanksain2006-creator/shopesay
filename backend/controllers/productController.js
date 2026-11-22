const mongoose = require('mongoose');
const Product = require('../models/Product');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);
    const filter = {};
    if (req.query.q) filter.name = { $regex: escapeRegex(String(req.query.q).slice(0, 50)), $options: 'i' };
    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.ids) {
      const ids = String(req.query.ids).split(',').filter((i) => mongoose.isValidObjectId(i)).slice(0, 50);
      filter._id = { $in: ids };
    }
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, products, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (err) { next(err); }
};

exports.categories = async (req, res, next) => {
  try {
    const categories = (await Product.distinct('category')).sort();
    res.json({ success: true, categories });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, price, category, image, stock } = req.body;
    const product = await Product.create({ name, description, price, category, image, stock });
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const data = {};
    ['name', 'description', 'price', 'category', 'image', 'stock'].forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};
