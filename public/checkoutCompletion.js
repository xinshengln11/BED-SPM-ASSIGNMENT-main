// =====================================================================
// Checkout Completion (SA2-25 confirmation view)
// MOCK DATA — shaped exactly like GET /checkout/confirmation/:orderId
// (order header + items + payment). When the backend is ready, read the
// orderId from the URL and fetch the real confirmation.
// =====================================================================
const confirmation = {
  OrderID: "ORD_004",
  OrderReference: "REF-1712345678",
  OrderStatus: "received",
  orderTotal: 17.00,
  items: [
    { itemCode: "DSH_001", itemName: "Roasted Chicken Rice", quantity: 2, unitPrice: 4.50, lineTotal: 9.00 },
    { itemCode: "DSH_019", itemName: "Chicken Satay (10 sticks)", quantity: 1, unitPrice: 8.00, lineTotal: 8.00 }
  ],
  payment: {
    PaymentID: "PAY_003",
    PaymentMethod: "PayNow",
    Amount: 17.00,
    PaymentStatus: "success"
  }
};

// ---- Real API version (uncomment when backend is ready) ----
// async function loadConfirmation() {
//   const orderId = new URLSearchParams(location.search).get("orderId");
//   const res = await fetch(`http://localhost:3000/checkout/confirmation/${orderId}`);
//   const data = await res.json();
//   render(data);
// }

function money(n) { return "$" + Number(n).toFixed(2); }

function render(data) {
  document.getElementById("ref").textContent =
    "Order reference: " + data.OrderReference;

  const count = data.items.reduce((s, i) => s + i.quantity, 0);
  document.getElementById("itemCount").textContent =
    count + (count === 1 ? " item" : " items");

  document.getElementById("itemLines").innerHTML = data.items.map(i => `
    <div class="line">
      <span><span class="q">${i.quantity}×</span> ${i.itemName}</span>
      <span>${money(i.lineTotal)}</span>
    </div>
  `).join("");

  document.getElementById("total").textContent = money(data.orderTotal);
  document.getElementById("payMethod").textContent =
    data.payment ? data.payment.PaymentMethod : "—";
}

render(confirmation); // using mock data for now