//MATTHIAS ORDER STATUS (SA2-29) - MODEL
const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Generate next status-history ID like 'SH_001'
async function generateStatusHistId(connection) {
  const result = await connection
    .request()
    .query("SELECT MAX(StatusHistID) AS maxId FROM orderStatusHistory");
  const maxId = result.recordset[0].maxId;
  let nextNum = 1;
  if (maxId) {
    nextNum = parseInt(maxId.split("_")[1]) + 1;
  }
  return "SH_" + String(nextNum).padStart(3, "0");
}

// ---------- READ: latest order for a customer + its current status ----------
async function getLatestOrderStatus(customerId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // 1. Find the customer's most recent order
    const orderRequest = connection.request();
    orderRequest.input("CustomerID", sql.VarChar(50), customerId);
    const orderResult = await orderRequest.query(`
      SELECT TOP 1 OrderID, OrderDate, OrderStatus, OrderReference
      FROM customerOrder
      WHERE CustomerID = @CustomerID
      ORDER BY OrderDate DESC`);

    if (orderResult.recordset.length === 0) {
      return null; // customer has no orders
    }
    const order = orderResult.recordset[0];

    // 2. Get the full status timeline for that order
    const histRequest = connection.request();
    histRequest.input("OrderID", sql.VarChar(50), order.OrderID);
    const histResult = await histRequest.query(`
      SELECT StatusHistID, Status, ChangedAt
      FROM orderStatusHistory
      WHERE OrderID = @OrderID
      ORDER BY ChangedAt ASC`);

    order.timeline = histResult.recordset;
    return order;
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

// ---------- READ: status timeline for a specific order ----------
async function getOrderStatusById(orderId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const orderRequest = connection.request();
    orderRequest.input("OrderID", sql.VarChar(50), orderId);
    const orderResult = await orderRequest.query(`
      SELECT OrderID, OrderDate, OrderStatus, OrderReference
      FROM customerOrder
      WHERE OrderID = @OrderID`);

    if (orderResult.recordset.length === 0) {
      return null;
    }
    const order = orderResult.recordset[0];

    const histRequest = connection.request();
    histRequest.input("OrderID", sql.VarChar(50), orderId);
    const histResult = await histRequest.query(`
      SELECT StatusHistID, Status, ChangedAt
      FROM orderStatusHistory
      WHERE OrderID = @OrderID
      ORDER BY ChangedAt ASC`);

    order.timeline = histResult.recordset;
    return order;
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

// ---------- UPDATE: change an order's status (updates column + logs history) ----------
async function updateOrderStatus(orderId, newStatus) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Make sure the order exists
    const checkRequest = connection.request();
    checkRequest.input("OrderID", sql.VarChar(50), orderId);
    const checkResult = await checkRequest.query(
      "SELECT OrderID FROM customerOrder WHERE OrderID = @OrderID"
    );
    if (checkResult.recordset.length === 0) {
      return null; // not found
    }

    // 1. Update the current status on the order
    const updateRequest = connection.request();
    updateRequest.input("OrderID", sql.VarChar(50), orderId);
    updateRequest.input("OrderStatus", sql.VarChar(20), newStatus);
    await updateRequest.query(
      "UPDATE customerOrder SET OrderStatus = @OrderStatus WHERE OrderID = @OrderID"
    );

    // 2. Log the change in the history table
    const histId = await generateStatusHistId(connection);
    const histRequest = connection.request();
    histRequest.input("StatusHistID", sql.VarChar(50), histId);
    histRequest.input("OrderID", sql.VarChar(50), orderId);
    histRequest.input("Status", sql.VarChar(20), newStatus);
    await histRequest.query(`
      INSERT INTO orderStatusHistory (StatusHistID, OrderID, Status)
      VALUES (@StatusHistID, @OrderID, @Status)`);

    return await getOrderStatusById(orderId);
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
  getLatestOrderStatus,
  getOrderStatusById,
  updateOrderStatus,
};