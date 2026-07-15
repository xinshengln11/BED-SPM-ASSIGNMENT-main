//MATTHIAS APP.JS
const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
dotenv.config();

const dbConfig = require("./dbConfig");

// --- Controllers ---
const stallController = require("./controllers/stallController");
const cartController = require("./controllers/cartController");
const orderStatusController = require("./controllers/orderStatusController");
const orderHistoryController = require("./controllers/orderHistoryController");
const checkoutController = require("./controllers/checkoutController");

// --- Validation middleware ---
const { validateStallId } = require("./middlewares/stallValidation");
const {
  validateAddToCart,
  validateUpdateCart,
  validateCartItemId,
} = require("./middlewares/cartValidation");
const {
  validateStatusUpdate,
  validateCheckout,
  validateIdParam,
} = require("./middlewares/orderFlowValidation");

const app = express();
const port = process.env.PORT || 3000;

// Body-parsing middleware (must come before routes that read req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// SA2-52  Browse stalls & menus (read-only)
// ============================================================
app.get("/stalls", stallController.getAllStalls);
app.get("/stalls/:id", validateStallId, stallController.getStallWithMenu);

// ============================================================
// SA2-24  Cart (full CRUD)
// ============================================================
app.get("/cart/:customerId", cartController.getCart);
app.post("/cart", validateAddToCart, cartController.addToCart);
app.put("/cart/:id", validateCartItemId, validateUpdateCart, cartController.updateCartItem);
app.delete("/cart/:id", validateCartItemId, cartController.removeCartItem);

// ============================================================
// SA2-29  Track order status
// NOTE: /latest/:customerId MUST come before /:orderId
// ============================================================
app.get("/orders/status/latest/:customerId", validateIdParam("customerId"), orderStatusController.getLatestStatus);
app.get("/orders/status/:orderId", validateIdParam("orderId"), orderStatusController.getStatusById);
app.put("/orders/status/:orderId", validateIdParam("orderId"), validateStatusUpdate, orderStatusController.updateStatus);

// ============================================================
// SA2-27  View order history (past/collected orders)
// ============================================================
app.get("/orders/history/:customerId", validateIdParam("customerId"), orderHistoryController.getHistory);

// ============================================================
// SA2-84 + SA2-53 + SA2-25  Checkout, payment status, confirmation
// ============================================================
app.post("/checkout", validateCheckout, checkoutController.checkout);
app.get("/payments/:orderId", validateIdParam("orderId"), checkoutController.getPaymentStatus);
app.get("/checkout/confirmation/:orderId", validateIdParam("orderId"), checkoutController.getConfirmation);

// ============================================================
// Start server + verify DB connection
// ============================================================
app.listen(port, async () => {
  try {
    await sql.connect(dbConfig);
    console.log("Database connection established successfully");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});

app.use(express.static("public"));