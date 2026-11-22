const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const c = require('../controllers/productController');

const idRule = param('id').isMongoId().withMessage('Invalid ID');

router.get('/', c.list);
router.get('/categories', c.categories);
router.get('/:id', [idRule], validate, c.getOne);

router.post(
  '/',
  protect, restrictTo('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or more').toFloat(),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a whole number, 0 or more').toInt(),
    body('category').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Category too long'),
    body('image').optional({ checkFalsy: true }).trim().isURL().withMessage('Image must be a valid URL'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  ],
  validate,
  c.create
);

router.put(
  '/:id',
  protect, restrictTo('admin'),
  [
    idRule,
    body('name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more').toFloat(),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a whole number, 0 or more').toInt(),
    body('category').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Category too long'),
    body('image').optional({ checkFalsy: true }).trim().isURL().withMessage('Image must be a valid URL'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  ],
  validate,
  c.update
);

router.delete('/:id', protect, restrictTo('admin'), [idRule], validate, c.remove);

module.exports = router;
