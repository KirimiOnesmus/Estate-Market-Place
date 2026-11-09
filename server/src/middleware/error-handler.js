function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err.status) ? err.status : err.code === 'P2002' ? 409 : 500;
  const code = err.code === 'P2002' ? 'DUPLICATE_RESOURCE' : err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  if (status >= 500) {
    console.error({ requestId: req.id, code });
  }

  res.status(status).json({
    error: {
      code,
      message: status >= 500 ? 'An unexpected error occurred' : (err.code === 'P2002' ? 'A record with these details already exists.' : err.message),
      ...(err.details ? { details: err.details } : {}),
    },
    requestId: req.id,
  });
}

module.exports = errorHandler;
