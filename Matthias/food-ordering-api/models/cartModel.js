//MATTHIAS ADD ITEMS TO CART (SA2-24) - MODEL
const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Generate next cart item ID like 'CART_001'
async function generateCartItemId(connection) {
  const result = await connection
    .request()
    .query("SELECT MAX(CartItemID) AS maxId FROM cartItem");
  const maxId = result.recordset[0].maxId;
  let nextNum = 1;
  if (maxId) {
    nextNum = parseInt(maxId.split("_")[1]) + 1;
  }
  return "CART_" + String(nextNum).padStart(3, "0");
}

// ---------- READ: all items in a customer's cart (with subtotal) ----------
async function getCart(customerId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("CustomerID", sql.VarChar(50), customerId);
    const query = `
      SELECT c.CartItemID, c.StallID, c.ItemCode, m.itemName, m.itemPrice,
             c.Quantity, (m.itemPrice * c.Quantity) AS subtotal
      FROM cartItem c
      JOIN menuItem m ON c.ItemCode = m.itemCode
      WHERE c.CustomerID = @CustomerID
      ORDER BY c.AddedAt`;
    const result = await request.query(query);
    return result.recordset;
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

// ---------- READ: one cart item by id ----------
async function getCartItemById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("id", sql.VarChar(50), id);
    const query = `
      SELECT c.CartItemID, c.CustomerID, c.StallID, c.ItemCode, m.itemName,
             m.itemPrice, c.Quantity, (m.itemPrice * c.Quantity) AS subtotal
      FROM cartItem c
      JOIN menuItem m ON c.ItemCode = m.itemCode
      WHERE c.CartItemID = @id`;
    const result = await request.query(query);
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

// ---------- CREATE: add an item to the cart ----------
// If the same item is already in the cart, increase its quantity instead.
async function addToCart(cartData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Make sure the menu item exists
    const checkRequest = connection.request();
    checkRequest.input("ItemCode", sql.VarChar(10), cartData.ItemCode);
    const checkResult = await checkRequest.query(
      "SELECT itemCode FROM menuItem WHERE itemCode = @ItemCode"
    );
    if (checkResult.recordset.length === 0) {
      const err = new Error(`Menu item ${cartData.ItemCode} does not exist`);
      err.statusCode = 400;
      throw err;
    }

    // Already in this customer's cart?
    const existingRequest = connection.request();
    existingRequest.input("CustomerID", sql.VarChar(50), cartData.CustomerID);
    existingRequest.input("ItemCode", sql.VarChar(10), cartData.ItemCode);
    const existing = await existingRequest.query(`
      SELECT CartItemID, Quantity FROM cartItem
      WHERE CustomerID = @CustomerID AND ItemCode = @ItemCode`);

    let cartItemId;
    if (existing.recordset.length > 0) {
      const row = existing.recordset[0];
      const newQty = row.Quantity + cartData.Quantity;
      const updateRequest = connection.request();
      updateRequest.input("id", sql.VarChar(50), row.CartItemID);
      updateRequest.input("Quantity", sql.Int, newQty);
      await updateRequest.query(
        "UPDATE cartItem SET Quantity = @Quantity WHERE CartItemID = @id"
      );
      cartItemId = row.CartItemID;
    } else {
      cartItemId = await generateCartItemId(connection);
      const insertRequest = connection.request();
      insertRequest.input("CartItemID", sql.VarChar(50), cartItemId);
      insertRequest.input("CustomerID", sql.VarChar(50), cartData.CustomerID);
      insertRequest.input("StallID", sql.VarChar(50), cartData.StallID);
      insertRequest.input("ItemCode", sql.VarChar(10), cartData.ItemCode);
      insertRequest.input("Quantity", sql.Int, cartData.Quantity);
      await insertRequest.query(`
        INSERT INTO cartItem (CartItemID, CustomerID, StallID, ItemCode, Quantity)
        VALUES (@CartItemID, @CustomerID, @StallID, @ItemCode, @Quantity)`);
    }

    return await getCartItemById(cartItemId);
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

// ---------- UPDATE: change quantity of a cart item ----------
async function updateCartItem(id, quantity) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const checkRequest = connection.request();
    checkRequest.input("id", sql.VarChar(50), id);
    const checkResult = await checkRequest.query(
      "SELECT CartItemID FROM cartItem WHERE CartItemID = @id"
    );
    if (checkResult.recordset.length === 0) {
      return null;
    }

    const updateRequest = connection.request();
    updateRequest.input("id", sql.VarChar(50), id);
    updateRequest.input("Quantity", sql.Int, quantity);
    await updateRequest.query(
      "UPDATE cartItem SET Quantity = @Quantity WHERE CartItemID = @id"
    );

    return await getCartItemById(id);
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

// ---------- DELETE: remove an item from the cart ----------
async function removeCartItem(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("id", sql.VarChar(50), id);
    const result = await request.query(
      "DELETE FROM cartItem WHERE CartItemID = @id"
    );
    return result.rowsAffected[0] > 0;
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
  getCart,
  getCartItemById,
  addToCart,
  updateCartItem,
  removeCartItem,
};