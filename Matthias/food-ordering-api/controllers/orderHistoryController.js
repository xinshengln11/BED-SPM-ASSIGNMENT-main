//MATTHIAS ORDER HISTORY (SA2-27) - CONTROLLER
const orderHistoryModel = require("../models/orderHistoryModel");

// GET /orders/history/:customerId -> past (collected) orders
async function getHistory(req, res) {
  try {
    const orders = await orderHistoryModel.getOrderHistory(
      req.params.customerId
    );
    res.json(orders);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving order history" });
  }
}

module.exports = { getHistory };