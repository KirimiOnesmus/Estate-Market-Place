function notFound(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
    requestId: req.id,
  });
}

module.exports = notFound;
