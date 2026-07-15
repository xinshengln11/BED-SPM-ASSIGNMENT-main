//MATTHIAS VIEW STALLS N MENU (SA2-52) - MIDDLEWARE
// Validate the :id URL parameter (string ID)
function validateStallId(req, res, next) {
  const id = req.params.id;
  if (!id || id.trim() === "") {
    return res
      .status(400)
      .json({ error: "Invalid stall ID. ID cannot be empty" });
  }
  next();
}

module.exports = { validateStallId };