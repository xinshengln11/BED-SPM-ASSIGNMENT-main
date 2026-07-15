// =====================================================================
// Checkout Cart (SA2-24 cart + entry to SA2-84 checkout)
// MOCK DATA — shaped exactly like the GET /cart/:customerId response.
// When the DB + backend are ready, replace the mock with a real fetch.
// =====================================================================
const CUSTOMER_ID = "USR_001";

let cart = [
  { CartItemID: "CART_001", StallID: "STALL_001", ItemCode: "DSH_001",
    itemName: "Roasted Chicken Rice", itemPrice: 4.50, Quantity: 2, subtotal: 9.00 },
  { CartItemID: "CART_002", StallID: "STALL_007", ItemCode: "DSH_019",
    itemName: "Chicken Satay (10 sticks)", itemPrice: 8.00, Quantity: 1, subtotal: 8.00 }
];

// ---- Real API version (uncomment when backend is ready) ----
// async function loadCart() {
//   const res = await fetch(`http://localhost:3000/cart/${CUSTOMER_ID}`);
//   cart = await res.json();
//   render();
// }

// Fee rates (must match whatever the backend charges on checkout)
const GST_RATE = 0.09;
const SERVICE_RATE = 0.10;
const RUSH_RATE = 0.05;

function money(n) { return "$" + n.toFixed(2); }

function render() {
  const box = document.getElementById("cartItems");

  if (cart.length === 0) {
    box.innerHTML = '<div class="empty">Your cart is empty. Browse stalls to add items.</div>';
    document.getElementById("checkoutBtn").disabled = true;
  } else {
    document.getElementById("checkoutBtn").disabled = false;
    box.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="item-info">
          <div class="item-name">${item.itemName}</div>
          <div class="item-stall">Stall ${item.StallID}</div>
        </div>
        <div class="qty">
          <button onclick="changeQty('${item.CartItemID}', -1)">−</button>
          <span>${item.Quantity}</span>
          <button onclick="changeQty('${item.CartItemID}', 1)">+</button>
        </div>
        <div class="item-price">${money(item.itemPrice * item.Quantity)}</div>
        <button class="remove" onclick="removeItem('${item.CartItemID}')">Remove</button>
      </div>
    `).join("");
  }

  const subtotal = cart.reduce((s, i) => s + i.itemPrice * i.Quantity, 0);
  const gst = subtotal * GST_RATE;
  const service = subtotal * SERVICE_RATE;
  const rush = subtotal * RUSH_RATE;
  const total = subtotal + gst + service + rush;

  document.getElementById("subtotal").textContent = money(subtotal);
  document.getElementById("gst").textContent = money(gst);
  document.getElementById("service").textContent = money(service);
  document.getElementById("rush").textContent = money(rush);
  document.getElementById("total").textContent = money(total);
}

// ---- Local mock handlers (swap for PUT/DELETE fetches later) ----
function changeQty(cartItemId, delta) {
  const item = cart.find(i => i.CartItemID === cartItemId);
  if (!item) return;
  item.Quantity = Math.max(1, item.Quantity + delta);
  render();
  // Real: fetch(`http://localhost:3000/cart/${cartItemId}`, { method: 'PUT',
  //   headers: {'Content-Type':'application/json'},
  //   body: JSON.stringify({ Quantity: item.Quantity }) })
}

function removeItem(cartItemId) {
  cart = cart.filter(i => i.CartItemID !== cartItemId);
  render();
  // Real: fetch(`http://localhost:3000/cart/${cartItemId}`, { method: 'DELETE' })
}

document.getElementById("checkoutBtn").addEventListener("click", () => {
  const method = document.getElementById("payMethod").value;
  // Real: POST /checkout, then redirect to completion with the OrderID
  // const res = await fetch('http://localhost:3000/checkout', { method:'POST',
  //   headers:{'Content-Type':'application/json'},
  //   body: JSON.stringify({ CustomerID: CUSTOMER_ID, PaymentMethod: method }) });
  // const data = await res.json();
  // window.location = `checkoutCompletion.html?orderId=${data.OrderID}`;
  window.location = "checkoutCompletion.html";
});

render(); // using mock data for now