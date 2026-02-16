import Joi from 'joi';

// ============================================
// AUTH VALIDATORS
// ============================================

export const loginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 50 characters',
      'string.alphanum': 'Username must contain only alphanumeric characters'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    })
});

export const createUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 50 characters'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    }),

  role: Joi.string()
    .valid('admin', 'data-entry')
    .default('data-entry')
    .messages({
      'any.only': 'Role must be either "admin" or "data-entry"'
    })
});

export const updateUserStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'any.only': 'Status must be either "active" or "inactive"'
    })
});

// ============================================
// SCORE VALIDATORS
// ============================================

export const createScoreSchema = Joi.object({
  event_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Event ID must be a number',
      'number.positive': 'Event ID must be positive'
    }),

  gender: Joi.string()
    .valid('male', 'female')
    .required()
    .messages({
      'any.only': 'Gender must be either "male" or "female"'
    }),

  athletes: Joi.array()
    .items(
      Joi.object({
        place: Joi.number()
          .integer()
          .min(1)
          .max(3)
          .required()
          .messages({
            'number.base': 'Place must be a number',
            'number.min': 'Place must be 1, 2, or 3'
          }),

        athlete_name: Joi.string()
          .trim()
          .max(100)
          .required()
          .messages({
            'string.empty': 'Athlete name is required',
            'string.max': 'Athlete name cannot exceed 100 characters'
          }),

        certificate_no: Joi.string()
          .trim()
          .max(50)
          .required()
          .messages({
            'string.empty': 'Certificate number is required',
            'string.max': 'Certificate number cannot exceed 50 characters'
          }),

        district_id: Joi.number()
          .integer()
          .valid(1, 2, 3)
          .required()
          .messages({
            'number.base': 'District ID must be a number',
            'any.only': 'District ID must be 1, 2, or 3'
          }),

        ds_office_id: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.base': 'DS Office ID must be a number'
          }),

        record_value: Joi.string()
          .trim()
          .max(50)
          .required()
          .messages({
            'string.empty': 'Record value is required',
            'string.max': 'Record value cannot exceed 50 characters'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one athlete is required'
    })
});

export const updateScoreSchema = Joi.object({
  athlete_name: Joi.string()
    .trim()
    .max(100),

  certificate_no: Joi.string()
    .trim()
    .max(50),

  district_id: Joi.number()
    .integer()
    .valid(1, 2, 3),

  ds_office_id: Joi.number()
    .integer()
    .positive(),

  record_value: Joi.string()
    .trim()
    .max(50),

  gender: Joi.string()
    .valid('male', 'female')
}).min(1);

// ============================================
// QUERY VALIDATORS
// ============================================

export const scoresFilterSchema = Joi.object({
  event_id: Joi.number().integer().positive(),
  district_id: Joi.number().integer().valid(1, 2, 3),
  ds_office_id: Joi.number().integer().positive(),
  gender: Joi.string().valid('male', 'female'),
  place: Joi.number().integer().min(1).max(3),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  search: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('created_at', 'athlete_name', 'record_value').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const dsOfficeFilterSchema = Joi.object({
  district_id: Joi.number()
    .integer()
    .valid(1, 2, 3)
    .required()
});

export const eventFilterSchema = Joi.object({
  category_id: Joi.number()
    .integer()
    .positive()
});

export default {
  loginSchema,
  createUserSchema,
  updateUserStatusSchema,
  createScoreSchema,
  updateScoreSchema,
  scoresFilterSchema,
  dsOfficeFilterSchema,
  eventFilterSchema
};
