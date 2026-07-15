//MATTHIAS ORDER STATUS (SA2-29) - CONTROLLER
const orderStatusModel = require("../models/orderStatusModel.js");

// GET /orders/status/latest/:customerId -> latest order + timeline
async function getLatestStatus(req, res) {
  try {
    const order = await orderStatusModel.getLatestOrderStatus(
      req.params.customerId
    );
    if (!order) {
      return res.status(404).json({ error: "No orders found for this customer" });
    }
    res.json(order);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving order status" });
  }
}

// GET /orders/status/:orderId -> a specific order's status + timeline
async function getStatusById(req, res) {
  try {
    const order = await orderStatusModel.getOrderStatusById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving order status" });
  }
}

// PUT /orders/status/:orderId -> update status (vendor moves order along)
async function updateStatus(req, res) {
  try {
    const updated = await orderStatusModel.updateOrderStatus(
      req.params.orderId,
      req.body.status
    );
    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error updating order status" });
  }
}

module.exports = { getLatestStatus, getStatusById, updateStatus };