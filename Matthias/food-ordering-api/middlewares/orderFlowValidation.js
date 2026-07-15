//MATTHIAS ORDER VALIDATION (SA2-27,SA2-53,SA2-25,SA2-84) - MIDDLEWARE
const Joi = require("joi");

// SA2-29: validate status update body
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid("received", "preparing", "ready", "collected", "cancelled")
    .required()
    .messages({
      "any.only":
        "status must be one of: received, preparing, ready, collected, cancelled",
      "any.required": "status is required",
    }),
});

function validateStatusUpdate(req, res, next) {
  const { error } = statusUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(400)
      .json({ error: error.details.map((d) => d.message).join(", ") });
  }
  next();
}

// SA2-84: validate checkout body
const checkoutSchema = Joi.object({
  CustomerID: Joi.string().min(1).max(50).required().messages({
    "string.empty": "CustomerID cannot be empty",
    "any.required": "CustomerID is required",
  }),
  PaymentMethod: Joi.string()
    .valid("Cash", "GrabPay", "Credit", "NETS", "PayNow")
    .required()
    .messages({
      "any.only":
        "PaymentMethod must be one of: Cash, GrabPay, Credit, NETS, PayNow",
      "any.required": "PaymentMethod is required",
    }),
});

function validateCheckout(req, res, next) {
  const { error } = checkoutSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(400)
      .json({ error: error.details.map((d) => d.message).join(", ") });
  }
  next();
}

// Shared: validate a string ID URL param (customerId or orderId)
function validateIdParam(paramName) {
  return function (req, res, next) {
    const id = req.params[paramName];
    if (!id || id.trim() === "") {
      return res
        .status(400)
        .json({ error: `Invalid ${paramName}. It cannot be empty` });
    }
    next();
  };
}

module.exports = { validateStatusUpdate, validateCheckout, validateIdParam };