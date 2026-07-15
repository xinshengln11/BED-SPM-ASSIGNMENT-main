const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get user by ID
async function getUserById(id) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("id", sql.VarChar(50), id)
    .query(`
      SELECT
        id,
        username,
        email,
        address,
        role,
        password AS passwordHash,
        AccountStatus,
        DeletedAt
      FROM Users
      WHERE id = @id
    `);

  connection.close();

  return result.recordset[0];
}

// Get user by username
async function getUserByUsername(username) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("username", sql.VarChar(50), username)
    .query(`
      SELECT
        id,
        username,
        email,
        address,
        role,
        password AS passwordHash,
        AccountStatus,
        DeletedAt
      FROM Users
      WHERE username = @username
    `);

  connection.close();

  return result.recordset[0];
}

// Get user by email
async function getUserByEmail(email) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("email", sql.VarChar(100), email)
    .query(`
      SELECT
        id,
        username,
        email,
        address,
        role,
        password AS passwordHash,
        AccountStatus,
        DeletedAt
      FROM Users
      WHERE email = @email
    `);

  connection.close();

  return result.recordset[0];
}

// Get user by either username or email for login
async function getUserByIdentifier(identifier) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("identifier", sql.VarChar(100), identifier)
    .query(`
      SELECT
        id,
        username,
        email,
        address,
        role,
        password AS passwordHash,
        AccountStatus,
        DeletedAt
      FROM Users
      WHERE username = @identifier
         OR email = @identifier
    `);

  connection.close();

  return result.recordset[0];
}

// Create a new user
async function createUser(user) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("id", sql.VarChar(50), user.id)
    .input("username", sql.VarChar(50), user.username)
    .input("email", sql.VarChar(100), user.email)
    .input("address", sql.VarChar(255), user.address)
    .input("role", sql.VarChar(20), user.role)
    .input("password", sql.Char(60), user.passwordHash)
    .query(`
      INSERT INTO Users (
        id,
        username,
        email,
        address,
        role,
        password,
        AccountStatus,
        DeletedAt
      )
      VALUES (
        @id,
        @username,
        @email,
        @address,
        @role,
        @password,
        'ACTIVE',
        NULL
      );

      SELECT
        id,
        username,
        email,
        address,
        role,
        AccountStatus,
        DeletedAt
      FROM Users
      WHERE id = @id;
    `);

  connection.close();

  return result.recordset[0];
}

module.exports = {
  getUserById,
  getUserByUsername,
  getUserByEmail,
  getUserByIdentifier,
  createUser
};