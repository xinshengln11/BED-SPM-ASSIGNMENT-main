//XINSHENG ORDER HISTORY - MODEL
// Reads from the food-ordering module's tables (customerOrder / orderItem /
// menuItem / foodStall), owned by Matthias's module. Table/column names here
// must stay identical to his so this keeps working once the databases merge.
const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function findOrderHistoryByCustomer(customerId, status) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const orderRequest = connection.request();
    orderRequest.input("CustomerID", sql.VarChar(50), customerId);
    let query = `
      SELECT OrderID, OrderDate, PmtType, OrderStatus, OrderReference
      FROM customerOrder
      WHERE CustomerID = @CustomerID`;
    if (status) {
      query += " AND OrderStatus = @Status";
      orderRequest.input("Status", sql.VarChar(20), status);
    }
    query += " ORDER BY OrderDate DESC";
    const orderResult = await orderRequest.query(query);

    const orders = orderResult.recordset;

    for (const order of orders) {
      const itemRequest = connection.request();
      itemRequest.input("OrderID", sql.VarChar(50), order.OrderID);
      const itemResult = await itemRequest.query(`
        SELECT oi.OrderItemNo, oi.itemCode, m.itemName, f.StallName,
               oi.quantity, oi.unitPrice,
               (oi.quantity * oi.unitPrice) AS lineTotal
        FROM orderItem oi
        JOIN menuItem m ON oi.itemCode = m.itemCode
        JOIN foodStall f ON oi.stallID = f.StallID
        WHERE oi.OrderID = @OrderID
        ORDER BY oi.OrderItemNo`);

      order.items = itemResult.recordset;
      order.stallName = itemResult.recordset[0]?.StallName || null;
      order.totalAmount = itemResult.recordset.reduce(
        (sum, item) => sum + item.lineTotal,
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

module.exports = { findOrderHistoryByCustomer };
