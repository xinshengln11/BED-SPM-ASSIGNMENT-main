//MATTHIAS ORDER HISTORY (SA2-27) - MODEL
const sql = require("mssql");
const dbConfig = require("../dbConfig");

// ---------- READ: all PAST (collected) orders for a customer ----------
// "Past purchases" = orders with status 'collected' (finished),
// which keeps this distinct from SA2-29 (the latest/in-progress order).
async function getOrderHistory(customerId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // 1. Get the customer's collected orders, newest first
    const orderRequest = connection.request();
    orderRequest.input("CustomerID", sql.VarChar(50), customerId);
    const orderResult = await orderRequest.query(`
      SELECT OrderID, OrderDate, PmtType, OrderStatus, OrderReference
      FROM customerOrder
      WHERE CustomerID = @CustomerID AND OrderStatus = 'collected'
      ORDER BY OrderDate DESC`);

    const orders = orderResult.recordset;

    // 2. For each order, attach its line items (with dish names)
    for (const order of orders) {
      const itemRequest = connection.request();
      itemRequest.input("OrderID", sql.VarChar(50), order.OrderID);
      const itemResult = await itemRequest.query(`
        SELECT oi.OrderItemNo, oi.itemCode, m.itemName,
               oi.quantity, oi.unitPrice,
               (oi.quantity * oi.unitPrice) AS lineTotal
        FROM orderItem oi
        JOIN menuItem m ON oi.itemCode = m.itemCode
        WHERE oi.OrderID = @OrderID
        ORDER BY oi.OrderItemNo`);
      order.items = itemResult.recordset;

      // Order total = sum of line totals
      order.orderTotal = itemResult.recordset.reduce(
        (sum, i) => sum + i.lineTotal,
        0
      );
    }

    return orders;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
  getOrderHistory,
};