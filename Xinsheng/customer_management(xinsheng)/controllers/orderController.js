const orderModel = require('../models/orderModel');

async function getOrderHistory(req, res) {
  const { customerId } = req.customer;
  const { status } = req.query;
  const orders = await orderModel.findOrderHistoryByCustomer(customerId, status);
  return res.status(200).json({ orders });
}

module.exports = { getOrderHistory };
