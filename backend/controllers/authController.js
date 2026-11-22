const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    // role is never taken from the request body: everyone registers as "user"
    const user = await User.create({ name, email, password });
    res.status(201).json({ success: true, token: sign(user._id), user: publicUser(user) });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    res.json({ success: true, token: sign(user._id), user: publicUser(user) });
  } catch (err) { next(err); }
};

exports.me = (req, res) => res.json({ success: true, user: publicUser(req.user) });

// JWT is stateless: the frontend deletes its token. This endpoint just confirms.
exports.logout = (req, res) => res.json({ success: true, message: 'Logged out' });
