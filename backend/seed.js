// Run once:  npm run seed
// Creates your admin account (from .env) and sample products (only if there are none).
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

const samples = [
  ['Wireless Bluetooth Earbuds', 'Compact earbuds with 20-hour battery life and clear sound.', 1499, 'Electronics', 40],
  ['Smart Fitness Band', 'Track steps, heart rate and sleep. Water resistant.', 1999, 'Electronics', 25],
  ['20000mAh Power Bank', 'Fast charging power bank with dual USB output.', 1299, 'Electronics', 60],
  ['Cotton Crew-Neck T-Shirt', 'Soft, breathable everyday t-shirt.', 399, 'Fashion', 100],
  ['Slim Fit Denim Jeans', 'Comfortable stretch denim in dark blue.', 1199, 'Fashion', 50],
  ['Running Shoes', 'Lightweight shoes with cushioned sole.', 2299, 'Fashion', 30],
  ['Stainless Steel Water Bottle', 'Keeps drinks cold for 24 hours. 750 ml.', 599, 'Home', 80],
  ['LED Desk Lamp', 'Adjustable brightness, USB powered.', 899, 'Home', 35],
  ['Non-Stick Cookware Set', '3-piece set: fry pan, kadhai and tawa.', 1799, 'Home', 20],
  ['Atomic Habits (Paperback)', 'A proven way to build good habits and break bad ones.', 449, 'Books', 70],
  ['Notebook Set (Pack of 4)', 'Ruled notebooks, 200 pages each.', 299, 'Books', 120],
  ['Herbal Face Wash', 'Gentle daily cleanser for all skin types. 100 ml.', 249, 'Beauty', 90],
];

(async () => {
  try {
    const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env first');
    if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');
    await mongoose.connect(MONGO_URI);

    let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (admin) { admin.role = 'admin'; await admin.save(); console.log('Existing user promoted to admin:', admin.email); }
    else { admin = await User.create({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' }); console.log('Admin created:', admin.email); }

    if ((await Product.countDocuments()) === 0) {
      await Product.insertMany(samples.map(([name, description, price, category, stock]) => ({ name, description, price, category, stock })));
      console.log(`Added ${samples.length} sample products`);
    } else console.log('Products already exist, skipped');
    console.log('Done. You can delete ADMIN_PASSWORD from .env now.');
  } catch (e) { console.error('Seed failed:', e.message); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();
