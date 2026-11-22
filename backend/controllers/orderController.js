const Order = require('../models/Order');
const Product = require('../models/Product');

const restock = (lines) =>
  Promise.all(lines.map((l) => Product.updateOne({ _id: l.product }, { $inc: { stock: l.quantity } })));

// Prices always come from the database, never from the browser.
exports.create = async (req, res, next) => {
  const reserved = [];
  try {
    const merged = new Map();
    for (const { productId, quantity } of req.body.items) {
      merged.set(productId, (merged.get(productId) || 0) + quantity);
    }
    const ids = [...merged.keys()];
    const products = await Product.find({ _id: { $in: ids } });
    if (products.length !== ids.length) {
      return res.status(400).json({ success: false, message: 'One or more products no longer exist' });
    }

    const lines = [];
    for (const p of products) {
      const qty = merged.get(String(p._id));
      if (qty > 20) return res.status(400).json({ success: false, message: `Maximum 20 of "${p.name}" per order` });
      if (p.stock < qty) {
        return res.status(400).json({ success: false, message: p.stock ? `Only ${p.stock} left of "${p.name}"` : `"${p.name}" is out of stock` });
      }
      lines.push({ product: p._id, name: p.name, price: p.price, quantity: qty });
    }

    for (const l of lines) {
      const r = await Product.updateOne({ _id: l.product, stock: { $gte: l.quantity } }, { $inc: { stock: -l.quantity } });
      if (r.modifiedCount !== 1) {
        await restock(reserved);
        return res.status(400).json({ success: false, message: `"${l.name}" just sold out. Please review your cart.` });
      }
      reserved.push(l);
    }

    const total = Math.round(lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100;
    const order = await Order.create({ user: req.user._id, items: lines, total, shipping: req.body.shipping });
    res.status(201).json({ success: true, order });
  } catch (err) {
    await restock(reserved).catch(() => {});
    next(err);
  }
};

exports.mine = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

exports.cancelMine = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'placed') {
      return res.status(400).json({ success: false, message: 'Only orders that have not shipped can be cancelled' });
    }
    order.status = 'cancelled';
    await order.save();
    await restock(order.items);
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

exports.listAll = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const next_ = req.body.status;
    if (order.status === 'cancelled' && next_ !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled orders cannot be reopened' });
    }
    const becomingCancelled = next_ === 'cancelled' && order.status !== 'cancelled';
    order.status = next_;
    await order.save();
    if (becomingCancelled) await restock(order.items);
    res.json({ success: true, order });
  } catch (err) { next(err); }
};
