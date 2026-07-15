// MATTHIAS ADD ITEMS TO CART (SA2-24) - MIDDLEWARE
const Joi = require("joi");

// Schema for adding an item to cart (POST)
const addToCartSchema = Joi.object({
  CustomerID: Joi.string().min(1).max(50).required().messages({
    "string.empty": "CustomerID cannot be empty",
    "any.required": "CustomerID is required",
  }),
  StallID: Joi.string().min(1).max(50).required().messages({
    "string.empty": "StallID cannot be empty",
    "any.required": "StallID is required",
  }),
  ItemCode: Joi.string().min(1).max(10).required().messages({
    "string.empty": "ItemCode cannot be empty",
    "any.required": "ItemCode is required",
  }),
  Quantity: Joi.number().integer().min(1).required().messages({
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
});

// Schema for updating a cart item quantity (PUT)
const updateCartSchema = Joi.object({
  Quantity: Joi.number().integer().min(1).required().messages({
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
});

function validateAddToCart(req, res, next) {
  const { error } = addToCartSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(400)
      .json({ error: error.details.map((d) => d.message).join(", ") });
  }
  next();
}

function validateUpdateCart(req, res, next) {
  const { error } = updateCartSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(400)
      .json({ error: error.details.map((d) => d.message).join(", ") });
  }
  next();
}

function validateCartItemId(req, res, next) {
  const id = req.params.id;
  if (!id || id.trim() === "") {
    return res
      .status(400)
      .json({ error: "Invalid cart item ID. ID cannot be empty" });
  }
  next();
}

module.exports = { validateAddToCart, validateUpdateCart, validateCartItemId };