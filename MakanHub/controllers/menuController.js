const menuItemModel = require("../models/menuItemModel");

/*
  GET /vendor/menu/:stallId

  Retrieves all menu items belonging to one stall.
*/
async function getMenuItemsByStall(req, res) {
  try {
    const stallId = parseInt(req.params.stallId);

    if (isNaN(stallId)) {
      return res.status(400).json({
        message: "Invalid stall ID."
      });
    }

    const menuItems =
      await menuItemModel.getMenuItemsByStallId(stallId);

    return res.status(200).json(menuItems);
  } catch (error) {
    console.error("Get menu items error:", error);

    return res.status(500).json({
      message: "Internal server error."
    });
  }
}

/*
  GET /vendor/menu/item/:itemCode

  Retrieves one menu item using its item code.
*/
async function getMenuItemByCode(req, res) {
  try {
    const itemCode = req.params.itemCode;

    if (!itemCode) {
      return res.status(400).json({
        message: "Item code is required."
      });
    }

    const menuItem =
      await menuItemModel.getMenuItemByCode(
        itemCode.trim()
      );

    if (!menuItem) {
      return res.status(400).json({
        message: "Menu item not found."
      });
    }

    return res.status(200).json(menuItem);
  } catch (error) {
    console.error("Get menu item error:", error);

    return res.status(500).json({
      message: "Internal server error."
    });
  }
}

/*
  POST /vendor/menu

  Creates a new menu item.
*/
async function createMenuItem(req, res) {
  try {
    const {
      itemCode,
      itemName,
      itemDesc,
      itemPrice,
      stallId,
      isAvailable,
      itemImage
    } = req.body;

    if (
      !itemCode ||
      !itemName ||
      !itemDesc ||
      itemPrice === undefined ||
      !stallId
    ) {
      return res.status(400).json({
        message:
          "Item code, item name, description, price and stall ID are required."
      });
    }

    const parsedPrice = parseFloat(itemPrice);
    const parsedStallId = parseInt(stallId);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        message:
          "Item price must be a valid positive number."
      });
    }

    if (isNaN(parsedStallId)) {
      return res.status(400).json({
        message: "Invalid stall ID."
      });
    }

    const existingItem =
      await menuItemModel.getMenuItemByCode(
        itemCode.trim()
      );

    if (existingItem) {
      return res.status(400).json({
        message: "Item code already exists."
      });
    }

    const newMenuItem =
      await menuItemModel.createMenuItem({
        itemCode: itemCode.trim(),
        itemName: itemName.trim(),
        itemDesc: itemDesc.trim(),
        itemPrice: parsedPrice,
        stallId: parsedStallId,
        isAvailable:
          isAvailable === undefined
            ? true
            : Boolean(isAvailable),
        itemImage:
          itemImage && itemImage.trim()
            ? itemImage.trim()
            : null
      });

    return res.status(201).json({
      message: "Menu item created successfully.",
      menuItem: newMenuItem
    });
  } catch (error) {
    console.error("Create menu item error:", error);

    return res.status(500).json({
      message: "Internal server error."
    });
  }
}

/*
  PUT /vendor/menu/:itemCode

  Updates an existing menu item.
*/
async function updateMenuItem(req, res) {
  try {
    const itemCode = req.params.itemCode;

    const {
      itemName,
      itemDesc,
      itemPrice,
      isAvailable,
      itemImage
    } = req.body;

    if (
      !itemCode ||
      !itemName ||
      !itemDesc ||
      itemPrice === undefined
    ) {
      return res.status(400).json({
        message:
          "Item code, item name, description and price are required."
      });
    }

    const parsedPrice = parseFloat(itemPrice);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        message:
          "Item price must be a valid positive number."
      });
    }

    const existingItem =
      await menuItemModel.getMenuItemByCode(
        itemCode.trim()
      );

    if (!existingItem) {
      return res.status(400).json({
        message: "Menu item not found."
      });
    }

    const updatedMenuItem =
      await menuItemModel.updateMenuItem(
        itemCode.trim(),
        {
          itemName: itemName.trim(),
          itemDesc: itemDesc.trim(),
          itemPrice: parsedPrice,
          isAvailable:
            isAvailable === undefined
              ? existingItem.isAvailable
              : Boolean(isAvailable),
          itemImage:
            itemImage && itemImage.trim()
              ? itemImage.trim()
              : null
        }
      );

    return res.status(200).json({
      message: "Menu item updated successfully.",
      menuItem: updatedMenuItem
    });
  } catch (error) {
    console.error("Update menu item error:", error);

    return res.status(500).json({
      message: "Internal server error."
    });
  }
}

/*
  DELETE /vendor/menu/:itemCode

  Deletes one menu item.
*/
async function deleteMenuItem(req, res) {
  try {
    const itemCode = req.params.itemCode;

    if (!itemCode) {
      return res.status(400).json({
        message: "Item code is required."
      });
    }

    const existingItem =
      await menuItemModel.getMenuItemByCode(
        itemCode.trim()
      );

    if (!existingItem) {
      return res.status(400).json({
        message: "Menu item not found."
      });
    }

    const deletedMenuItem =
      await menuItemModel.deleteMenuItem(
        itemCode.trim()
      );

    return res.status(200).json({
      message: "Menu item deleted successfully.",
      menuItem: deletedMenuItem
    });
  } catch (error) {
    console.error("Delete menu item error:", error);

    return res.status(500).json({
      message: "Internal server error."
    });
  }
}

module.exports = {
  getMenuItemsByStall,
  getMenuItemByCode,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};