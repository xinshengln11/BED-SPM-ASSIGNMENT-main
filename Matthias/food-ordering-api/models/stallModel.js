//MATTHIAS VIEW STALLS N MENU (SA2-52) - MODEL
const sql = require("mssql");
const dbConfig = require("../dbConfig");

// ---------- READ: get all stalls (optional StallStatus filter) ----------
// foodStall has no cuisine column; a customer browse typically wants
// only ACTIVE stalls, so we allow an optional ?status filter.
async function getAllStalls(status) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    let query =
      "SELECT StallID, StallUnitNo, StallName, StallDesc, StallStatus FROM foodStall";
    const request = connection.request();
    if (status) {
      query += " WHERE StallStatus = @status";
      request.input("status", sql.VarChar(20), status);
    }
    query += " ORDER BY StallName";
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

// ---------- READ: get one stall with its menu items ----------
async function getStallWithMenu(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const stallRequest = connection.request();
    stallRequest.input("id", sql.VarChar(50), id);
    const stallResult = await stallRequest.query(
      "SELECT StallID, StallUnitNo, StallName, StallDesc, StallStatus FROM foodStall WHERE StallID = @id"
    );
    if (stallResult.recordset.length === 0) {
      return null;
    }
    const stall = stallResult.recordset[0];

    const menuRequest = connection.request();
    menuRequest.input("id", sql.VarChar(50), id);
    const menuResult = await menuRequest.query(`
      SELECT itemCode, itemName, itemDesc, itemPrice, itemCategory, isAvailable, itemImage
      FROM menuItem
      WHERE StallID = @id
      ORDER BY itemName`);

    stall.menu = menuResult.recordset;
    return stall;
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

module.exports = { getAllStalls, getStallWithMenu };