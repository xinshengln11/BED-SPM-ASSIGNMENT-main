//XINSHENG CUSTOMER (SA2-2, SA2-3, SA2-74, SA2-75, SA2-76, SA2-77) - MODEL
const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Generate next customer ID like 'CUST_001' (same read-max-add-one pattern
// used across the team's other modules, e.g. Matthias's cartItem/order IDs).
async function generateCustomerId(connection) {
  const result = await connection
    .request()
    .query("SELECT MAX(CustomerID) AS maxId FROM Customers");
  const maxId = result.recordset[0].maxId;
  let nextNum = 1;
  if (maxId) {
    nextNum = parseInt(maxId.split("_")[1]) + 1;
  }
  return "CUST_" + String(nextNum).padStart(3, "0");
}

async function findByEmail(email) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("Email", sql.VarChar(150), email);
    const result = await request.query(
      "SELECT * FROM Customers WHERE Email = @Email"
    );
    return result.recordset[0] || null;
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

async function findById(customerId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("CustomerID", sql.VarChar(50), customerId);
    const result = await request.query(
      "SELECT CustomerID, Name, Email, CreatedAt FROM Customers WHERE CustomerID = @CustomerID"
    );
    return result.recordset[0] || null;
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

async function findByIdWithPassword(customerId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("CustomerID", sql.VarChar(50), customerId);
    const result = await request.query(
      "SELECT CustomerID, PasswordHash FROM Customers WHERE CustomerID = @CustomerID"
    );
    return result.recordset[0] || null;
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

async function create({ name, email, passwordHash }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const customerId = await generateCustomerId(connection);

    const request = connection.request();
    request.input("CustomerID", sql.VarChar(50), customerId);
    request.input("Name", sql.VarChar(100), name);
    request.input("Email", sql.VarChar(150), email);
    request.input("PasswordHash", sql.VarChar(255), passwordHash);
    await request.query(`
      INSERT INTO Customers (CustomerID, Name, Email, PasswordHash)
      VALUES (@CustomerID, @Name, @Email, @PasswordHash)`);

    const readRequest = connection.request();
    readRequest.input("CustomerID", sql.VarChar(50), customerId);
    const result = await readRequest.query(
      "SELECT CustomerID, Name, Email, CreatedAt FROM Customers WHERE CustomerID = @CustomerID"
    );
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

async function updateProfile(customerId, { name, email }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const updateRequest = connection.request();
    updateRequest.input("CustomerID", sql.VarChar(50), customerId);
    updateRequest.input("Name", sql.VarChar(100), name);
    updateRequest.input("Email", sql.VarChar(150), email);
    await updateRequest.query(
      "UPDATE Customers SET Name = @Name, Email = @Email WHERE CustomerID = @CustomerID"
    );

    const readRequest = connection.request();
    readRequest.input("CustomerID", sql.VarChar(50), customerId);
    const result = await readRequest.query(
      "SELECT CustomerID, Name, Email, CreatedAt FROM Customers WHERE CustomerID = @CustomerID"
    );
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

async function updatePassword(customerId, passwordHash) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("CustomerID", sql.VarChar(50), customerId);
    request.input("PasswordHash", sql.VarChar(255), passwordHash);
    await request.query(
      "UPDATE Customers SET PasswordHash = @PasswordHash WHERE CustomerID = @CustomerID"
    );
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

async function deleteById(customerId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("CustomerID", sql.VarChar(50), customerId);
    const result = await request.query(
      "DELETE FROM Customers WHERE CustomerID = @CustomerID"
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
  findByEmail,
  findById,
  findByIdWithPassword,
  create,
  updateProfile,
  updatePassword,
  deleteById,
};
