const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const c = require('../controllers/contactController');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many messages. Try again later.' },
});

router.post(
  '/',
  contactLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Message must be 5-2000 characters'),
  ],
  validate,
  c.create
);

router.get('/', protect, restrictTo('admin'), c.list);
router.delete('/:id', protect, restrictTo('admin'), [param('id').isMongoId().withMessage('Invalid ID')], validate, c.remove);

module.exports = router;
