//MATTHIAS VIEW STALLS N MENU (SA2-52) - CONTROLLER
const stallModel = require("../models/stallModel");

// GET /stalls  (optional ?status=ACTIVE)
async function getAllStalls(req, res) {
  try {
    const status = req.query.status; // undefined if not provided
    const stalls = await stallModel.getAllStalls(status);
    res.json(stalls);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving stalls" });
  }
}

// GET /stalls/:id  -> stall + its menu
async function getStallWithMenu(req, res) {
  try {
    const id = req.params.id; // string ID
    const stall = await stallModel.getStallWithMenu(id);
    if (!stall) {
      return res.status(404).json({ error: "Stall not found" });
    }
    res.json(stall);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving stall menu" });
  }
}

module.exports = { getAllStalls, getStallWithMenu };