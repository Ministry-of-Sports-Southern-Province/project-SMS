import Joi from 'joi';

// Middleware to validate request body against schema
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      stripUnknown: true,
      convert: true
    });

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req.body = value;
    next();
  };
};

// Middleware to validate query parameters
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      stripUnknown: true,
      convert: true
    });

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req.query = value;
    next();
  };
};

// Middleware to validate URL parameters
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      stripUnknown: true,
      convert: true
    });

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req.params = value;
    next();
  };
};

export default validateRequest;
