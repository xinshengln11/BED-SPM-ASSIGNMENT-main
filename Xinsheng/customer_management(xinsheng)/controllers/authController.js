//XINSHENG AUTH (SA2-2, SA2-3, SA2-74, SA2-75, SA2-76, SA2-77) - CONTROLLER
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const customerModel = require('../models/customerModel');

const SALT_ROUNDS = 10;

// Field validation (required/format/length) is handled by the Joi middleware
// in middlewares/authValidation.js before these handlers run.

function signToken(customerId) {
  return jwt.sign({ customerId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

function setAuthCookie(res, token) {
  // Tie the cookie's lifetime to the JWT's own `exp` claim so the browser
  // automatically drops the cookie the moment the token itself expires,
  // regardless of what JWT_EXPIRES_IN is set to.
  const { exp } = jwt.decode(token);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: exp * 1000 - Date.now(),
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}

// DB rows come back with PascalCase columns (CustomerID, Name, Email,
// CreatedAt) to match the team's SQL Server convention; this shapes the
// JSON response the frontend actually consumes.
function toCustomerJson(customer) {
  return {
    customerId: customer.CustomerID,
    name: customer.Name,
    email: customer.Email,
    createdAt: customer.CreatedAt,
  };
}

async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await customerModel.findByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const customer = await customerModel.create({ name, email, passwordHash });

  return res.status(201).json({ message: 'Account created successfully.', customer: toCustomerJson(customer) });
}

async function login(req, res) {
  const { email, password } = req.body;

  const customer = await customerModel.findByEmail(email);
  if (!customer) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const passwordMatches = await bcrypt.compare(password, customer.PasswordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = signToken(customer.CustomerID);
  setAuthCookie(res, token);

  return res.status(200).json({
    message: 'Logged in successfully.',
    customer: toCustomerJson(customer),
  });
}

function logout(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ message: 'Logged out successfully.' });
}

async function getProfile(req, res) {
  const { customerId } = req.customer;

  const customer = await customerModel.findById(customerId);
  if (!customer) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  return res.status(200).json({ customer: toCustomerJson(customer) });
}

async function updateProfile(req, res) {
  const { customerId } = req.customer;
  const { name, email } = req.body;

  const existing = await customerModel.findByEmail(email);
  if (existing && existing.CustomerID !== customerId) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const customer = await customerModel.updateProfile(customerId, { name, email });
  return res.status(200).json({ message: 'Profile updated successfully.', customer: toCustomerJson(customer) });
}

async function deleteAccount(req, res) {
  const { customerId } = req.customer;

  const deleted = await customerModel.deleteById(customerId);
  if (!deleted) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  clearAuthCookie(res);
  return res.status(200).json({ message: 'Account deleted successfully.' });
}

async function changePassword(req, res) {
  const { customerId } = req.customer;
  const { currentPassword, newPassword } = req.body;

  const customer = await customerModel.findByIdWithPassword(customerId);
  if (!customer) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  const currentMatches = await bcrypt.compare(currentPassword, customer.PasswordHash);
  if (!currentMatches) {
    return res.status(401).json({ message: 'Current password is incorrect.' });
  }

  const isSameAsOld = await bcrypt.compare(newPassword, customer.PasswordHash);
  if (isSameAsOld) {
    return res.status(400).json({ message: 'New password must be different from the current password.' });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await customerModel.updatePassword(customerId, newPasswordHash);

  return res.status(200).json({ message: 'Password changed successfully.' });
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  deleteAccount,
  changePassword,
};
