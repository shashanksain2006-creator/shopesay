const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const c = require('../controllers/orderController');

const idRule = param('id').isMongoId().withMessage('Invalid ID');

router.use(protect);

router.post(
  '/',
  [
    body('items').isArray({ min: 1, max: 50 }).withMessage('Your cart is empty'),
    body('items.*.productId').isMongoId().withMessage('Invalid product'),
    body('items.*.quantity').isInt({ min: 1, max: 20 }).withMessage('Quantity must be 1-20').toInt(),
    body('shipping.fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your full name'),
    body('shipping.phone').trim().matches(/^[0-9+\-\s]{7,15}$/).withMessage('Enter a valid phone number'),
    body('shipping.address').trim().isLength({ min: 5, max: 200 }).withMessage('Enter your address'),
    body('shipping.city').trim().isLength({ min: 2, max: 60 }).withMessage('Enter your city'),
    body('shipping.postalCode').trim().isLength({ min: 3, max: 10 }).withMessage('Enter a valid postal code'),
  ],
  validate,
  c.create
);

router.get('/mine', c.mine);
router.put('/:id/cancel', [idRule], validate, c.cancelMine);

router.get('/', restrictTo('admin'), c.listAll);
router.put(
  '/:id/status',
  restrictTo('admin'),
  [idRule, body('status').isIn(['placed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')],
  validate,
  c.updateStatus
);

module.exports = router;
