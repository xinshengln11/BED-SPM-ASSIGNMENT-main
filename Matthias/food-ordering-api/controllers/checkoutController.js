//MATTHIAS CHECKOUT (SA2-84 AND SA2-53) - CONTROLLER
// includes SA2-84 (Checkout), SA2-53 (Payment), SA2-25 (Checkout Confirmation)
const checkoutModel = require("../models/checkoutModel");

// POST /checkout -> turn the customer's cart into an order + payment
async function checkout(req, res) {
  try {
    const { CustomerID, PaymentMethod } = req.body;
    const confirmation = await checkoutModel.checkout(CustomerID, PaymentMethod);
    res.status(201).json(confirmation);
  } catch (error) {
    console.error("Controller error:", error);
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error during checkout" });
  }
}

// GET /payments/:orderId -> payment status for an order (SA2-53 read side)
async function getPaymentStatus(req, res) {
  try {
    const orderId = req.params.orderId;
    const payment = await checkoutModel.getPaymentByOrderId(orderId);
    if (!payment) {
      return res.status(404).json({ error: "No payment found for this order" });
    }
    res.json(payment);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving payment status" });
  }
}

// GET /checkout/confirmation/:orderId -> full confirmation (SA2-25)
// Powers the Checkout_Completion page.
async function getConfirmation(req, res) {
  try {
    const orderId = req.params.orderId;
    const confirmation = await checkoutModel.getCheckoutConfirmation(orderId);
    if (!confirmation) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(confirmation);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving checkout confirmation" });
  }
}

module.exports = { checkout, getPaymentStatus, getConfirmation };