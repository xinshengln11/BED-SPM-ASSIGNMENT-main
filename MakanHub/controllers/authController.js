const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userModel = require("../models/userModel");
const stallOwnerModel = require("../models/stallOwnerModel");

// POST /register/vendor
async function registerStallOwner(req, res) {
  try {
    const {
      id,
      username,
      email,
      address,
      password,
      contactNo
    } = req.body;

    // Check all required fields
    if (
      !id ||
      !username ||
      !email ||
      !address ||
      !password ||
      !contactNo
    ) {
      return res.status(400).json({
        message:
          "ID, username, email, address, password and contact number are required."
      });
    }

    // Remove spaces before and after entered values
    const cleanId = id.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanAddress = address.trim();
    const cleanContactNo = contactNo.trim();

    // Validate ID format, for example USR_018
    const idPattern = /^USR_\d+$/;

    if (!idPattern.test(cleanId)) {
      return res.status(400).json({
        message:
          "User ID must follow the format USR_001."
      });
    }

    // Validate username
    if (cleanUsername.length < 3) {
      return res.status(400).json({
        message:
          "Username must contain at least 3 characters."
      });
    }

    // Validate email
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({
        message:
          "Please enter a valid email address."
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters."
      });
    }

    // Validate Singapore contact number
    const contactPattern = /^[689]\d{7}$/;

    if (!contactPattern.test(cleanContactNo)) {
      return res.status(400).json({
        message:
          "Contact number must be a valid 8-digit Singapore number."
      });
    }

    // Check whether ID already exists
    const existingId =
      await userModel.getUserById(cleanId);

    if (existingId) {
      return res.status(400).json({
        message: "User ID already exists."
      });
    }

    // Check whether username already exists
    const existingUsername =
      await userModel.getUserByUsername(
        cleanUsername
      );

    if (existingUsername) {
      return res.status(400).json({
        message: "Username already exists."
      });
    }

    // Check whether email already exists
    const existingEmail =
      await userModel.getUserByEmail(
        cleanEmail
      );

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists."
      });
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);

    const passwordHash =
      await bcrypt.hash(password, salt);

    // Insert account into Users
    const newUser = await userModel.createUser({
      id: cleanId,
      username: cleanUsername,
      email: cleanEmail,
      address: cleanAddress,
      role: "stall_owner",
      passwordHash: passwordHash
    });

    // Insert stall-owner details into stallOwner
    await stallOwnerModel.createStallOwner({
      stlOwnerId: cleanId,
      contactNo: cleanContactNo
    });

    return res.status(201).json({
      message:
        "Stall owner account created successfully.",

      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        address: newUser.address,
        role: newUser.role,
        contactNo: cleanContactNo
      }
    });
  } catch (error) {
    console.error(
      "Register stall owner error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error."
    });
  }
}

// POST /login/vendor
async function loginStallOwner(req, res) {
  try {
    const {
      identifier,
      password
    } = req.body;

    // Identifier accepts either username or email
    if (!identifier || !password) {
      return res.status(400).json({
        message:
          "Username/email and password are required."
      });
    }

    const user =
      await userModel.getUserByIdentifier(
        identifier.trim()
      );

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid username/email or password."
      });
    }

    // Confirm that account belongs to a stall owner
    if (user.role !== "stall_owner") {
      return res.status(400).json({
        message:
          "Only stall owners can use this login endpoint."
      });
    }

    // Confirm account is active
    if (user.AccountStatus !== "ACTIVE") {
      return res.status(400).json({
        message:
          "This account is not active."
      });
    }

    // Compare entered password with database hash
    const isMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(401).json({
        message:
          "Invalid username/email or password."
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    return res.status(200).json({
      message: "Login successful.",
      token: token,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error(
      "Stall owner login error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error."
    });
  }
}

module.exports = {
  registerStallOwner,
  loginStallOwner
};