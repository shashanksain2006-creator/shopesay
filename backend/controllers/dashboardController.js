const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Contact = require('../models/Contact');

exports.stats = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      const [products, orders, placed, users, messages, revenue] = await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ status: 'placed' }),
        User.countDocuments(),
        Contact.countDocuments(),
        Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, sum: { $sum: '$total' } } }]),
      ]);
      return res.json({ success: true, stats: { products, orders, newOrders: placed, users, messages, revenue: revenue[0] ? revenue[0].sum : 0 } });
    }
    const [orders, spent] = await Promise.all([
      Order.countDocuments({ user: req.user._id }),
      Order.aggregate([{ $match: { user: req.user._id, status: { $ne: 'cancelled' } } }, { $group: { _id: null, sum: { $sum: '$total' } } }]),
    ]);
    res.json({ success: true, stats: { orders, spent: spent[0] ? spent[0].sum : 0 } });
  } catch (err) { next(err); }
};
