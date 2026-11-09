class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? (source === 'body' ? {} : req[source]));
    if (!result.success) {
      return next(new HttpError(422, 'VALIDATION_ERROR', 'Check the submitted fields.', result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { HttpError, asyncHandler, validate };
