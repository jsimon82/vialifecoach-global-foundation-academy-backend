export function errorMiddleware(err, req, res, next) {
  console.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);

  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? {} : err.stack,
  });
}
