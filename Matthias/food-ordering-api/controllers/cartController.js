//MATTHIAS ADD ITEMS TO CART (SA2-24) - CONTROLLER
const cartModel = require("../models/cartModel");

// GET /cart/:customerId  -> all items in that customer's cart
async function getCart(req, res) {
  try {
    const customerId = req.params.customerId;
    const items = await cartModel.getCart(customerId);
    res.json(items);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving cart" });
  }
}

// POST /cart  -> add an item to the cart
async function addToCart(req, res) {
  try {
    const cartItem = await cartModel.addToCart(req.body);
    res.status(201).json(cartItem);
  } catch (error) {
    console.error("Controller error:", error);
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error adding item to cart" });
  }
}

// PUT /cart/:id  -> update the quantity of a cart item
async function updateCartItem(req, res) {
  try {
    const id = req.params.id; // string ID
    const updated = await cartModel.updateCartItem(id, req.body.Quantity);
    if (!updated) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error updating cart item" });
  }
}

// DELETE /cart/:id  -> remove an item from the cart
async function removeCartItem(req, res) {
  try {
    const id = req.params.id; // string ID
    const removed = await cartModel.removeCartItem(id);
    if (!removed) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    res.json({ message: `Cart item ${id} removed successfully` });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error removing cart item" });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };