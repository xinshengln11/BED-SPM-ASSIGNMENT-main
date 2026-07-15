//MATTHIAS CHECKOUT (SA2-84 AND SA2-53) - MODEL
// includes both SA2-84(Checkout) and SA2-53(Payment) as they are part of the same flow
const sql = require("mssql");
const dbConfig = require("../dbConfig");

// --- ID generators (string IDs, read-max-add-one) ---
async function nextId(connection, table, col, prefix) {
  const result = await connection
    .request()
    .query(`SELECT MAX(${col}) AS maxId FROM ${table}`);
  const maxId = result.recordset[0].maxId;
  let n = 1;
  if (maxId) n = parseInt(maxId.split("_")[1]) + 1;
  return prefix + "_" + String(n).padStart(3, "0");
}

function generateOrderReference() {
  return "REF-" + Date.now();
}

// ---------- CHECKOUT: cart -> order + orderItems + payment ----------
// Combines SA2-84 (checkout) with SA2-53 (payment) as one flow.
// Steps: read cart -> create order -> copy cart lines into orderItem
//        -> record payment -> clear the cart.
async function checkout(customerId, paymentMethod) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // 1. Read the customer's cart (join menuItem for current prices)
    const cartRequest = connection.request();
    cartRequest.input("CustomerID", sql.VarChar(50), customerId);
    const cartResult = await cartRequest.query(`
      SELECT c.CartItemID, c.StallID, c.ItemCode, c.Quantity, m.itemPrice
      FROM cartItem c
      JOIN menuItem m ON c.ItemCode = m.itemCode
      WHERE c.CustomerID = @CustomerID`);

    const cartItems = cartResult.recordset;
    if (cartItems.length === 0) {
      const err = new Error("Cart is empty. Nothing to checkout.");
      err.statusCode = 400;
      throw err;
    }

    // 2. Work out the total (subtotal + GST + service + rush-hour fees)
    // Fee rates must match what the Checkout Cart page displays.
    const GST_RATE = 0.09;
    const SERVICE_RATE = 0.10;
    const RUSH_RATE = 0.05;

    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.itemPrice * item.Quantity;
    }
    const gst = subtotal * GST_RATE;
    const service = subtotal * SERVICE_RATE;
    const rush = subtotal * RUSH_RATE;
    const total = subtotal + gst + service + rush;

    // 3. Create the order header
    const orderId = await nextId(connection, "customerOrder", "OrderID", "ORD");
    const orderRef = generateOrderReference();
    const orderRequest = connection.request();
    orderRequest.input("OrderID", sql.VarChar(50), orderId);
    orderRequest.input("PmtType", sql.VarChar(20), paymentMethod);
    orderRequest.input("CustomerID", sql.VarChar(50), customerId);
    orderRequest.input("OrderReference", sql.VarChar(50), orderRef);
    await orderRequest.query(`
      INSERT INTO customerOrder (OrderID, OrderDate, PmtType, CustomerID, OrderStatus, OrderReference)
      VALUES (@OrderID, GETDATE(), @PmtType, @CustomerID, 'received', @OrderReference)`);

    // 4. Copy each cart line into orderItem (price snapshot)
    let itemNo = 1;
    for (const item of cartItems) {
      const itemRequest = connection.request();
      itemRequest.input("OrderID", sql.VarChar(50), orderId);
      itemRequest.input("OrderItemNo", sql.Int, itemNo);
      itemRequest.input("stallID", sql.VarChar(50), item.StallID);
      itemRequest.input("itemCode", sql.VarChar(10), item.ItemCode);
      itemRequest.input("quantity", sql.Int, item.Quantity);
      itemRequest.input("unitPrice", sql.Decimal(6, 2), item.itemPrice);
      await itemRequest.query(`
        INSERT INTO orderItem (OrderID, OrderItemNo, stallID, itemCode, quantity, unitPrice)
        VALUES (@OrderID, @OrderItemNo, @stallID, @itemCode, @quantity, @unitPrice)`);
      itemNo++;
    }

    // 5. Log the initial status in history
    const histId = await nextId(connection, "orderStatusHistory", "StatusHistID", "SH");
    const histRequest = connection.request();
    histRequest.input("StatusHistID", sql.VarChar(50), histId);
    histRequest.input("OrderID", sql.VarChar(50), orderId);
    await histRequest.query(`
      INSERT INTO orderStatusHistory (StatusHistID, OrderID, Status)
      VALUES (@StatusHistID, @OrderID, 'received')`);

    // 6. Record the payment (SA2-53 combined in)
    const payId = await nextId(connection, "payment", "PaymentID", "PAY");
    const payRequest = connection.request();
    payRequest.input("PaymentID", sql.VarChar(50), payId);
    payRequest.input("OrderID", sql.VarChar(50), orderId);
    payRequest.input("PaymentMethod", sql.VarChar(20), paymentMethod);
    payRequest.input("Amount", sql.Decimal(10, 2), total);
    await payRequest.query(`
      INSERT INTO payment (PaymentID, OrderID, PaymentMethod, Amount, PaymentStatus)
      VALUES (@PaymentID, @OrderID, @PaymentMethod, @Amount, 'success')`);

    // 7. Clear the customer's cart
    const clearRequest = connection.request();
    clearRequest.input("CustomerID", sql.VarChar(50), customerId);
    await clearRequest.query(
      "DELETE FROM cartItem WHERE CustomerID = @CustomerID"
    );

    // 8. Return a confirmation object
    return {
      OrderID: orderId,
      OrderReference: orderRef,
      OrderStatus: "received",
      PaymentID: payId,
      PaymentMethod: paymentMethod,
      Amount: total,
      PaymentStatus: "success",
      itemCount: cartItems.length,
    };
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


// ---------- READ: payment status for an order (was the old payment feature) ----------
// Used by the Checkout Completion page to show "payment successful".
async function getPaymentByOrderId(orderId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("OrderID", sql.VarChar(50), orderId);
    const result = await request.query(`
      SELECT PaymentID, OrderID, PaymentMethod, Amount, PaymentStatus, PaidAt
      FROM payment
      WHERE OrderID = @OrderID`);
    if (result.recordset.length === 0) {
      return null;
    }
    return result.recordset[0];
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
  checkout,
  getPaymentByOrderId,
};