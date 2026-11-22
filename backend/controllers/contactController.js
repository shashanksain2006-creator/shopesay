const Contact = require('../models/Contact');

exports.create = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    await Contact.create({ name, email, message });
    res.status(201).json({ success: true, message: 'Thanks! Your message has been sent.' });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, count: messages.length, messages });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await Contact.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
};
