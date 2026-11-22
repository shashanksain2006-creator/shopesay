exports.notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err);
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.code === 11000) { status = 409; message = 'That value already exists'; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors)[0].message; }
  if (err.name === 'CastError') { status = 400; message = 'Invalid ID'; }
  if (status === 500 && process.env.NODE_ENV === 'production') message = 'Server error';

  res.status(status).json({ success: false, message });
};
