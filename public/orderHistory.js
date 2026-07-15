/**
 * Order History page logic.
 * Fetches the signed-in customer's orders from the backend and renders them
 * as cards, filtered by status (All / Preparing / Completed).
 */

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';

const orderListEl = document.getElementById('orderList');
const emptyStateEl = document.getElementById('emptyState');
const filterFormEl = document.getElementById('filterBar');
const statusFilterEl = document.getElementById('statusFilter');

// Used only if the backend is unreachable, so the page still demoes standalone.
const FALLBACK_ORDERS = [
  {
    orderId: '001',
    hawkerCentre: 'ABC Hawker Centre',
    stallName: 'Fried Kway Teow Stall',
    dishImageUrl: '',
    orderDate: '2026-04-15T12:30:00',
    totalAmount: 6.5,
    status: 'collected',
  },
  {
    orderId: '002',
    hawkerCentre: 'XYZ Hawker Centre',
    stallName: 'Chicken Rice',
    dishImageUrl: '',
    orderDate: '2026-04-15T12:30:00',
    totalAmount: 5.0,
    status: 'preparing',
  },
];

function formatOrderDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('en-SG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

// Maps a row from GET /api/orders/history (customer_management API shape,
// backed by the food-ordering module's customerOrder/orderItem tables) into
// the {orderId, hawkerCentre, stallName, dishImageUrl, orderDate,
// totalAmount, status} shape this page renders. The schema has no "hawker
// centre" or dish-image concept yet, so the stall name is used as the
// heading and the ordered items are summarised as the subtitle line.
function mapOrder(order) {
  const itemsSummary = (order.items || [])
    .map((item) => `${item.quantity}x ${item.itemName}`)
    .join(', ');

  return {
    orderId: order.OrderID,
    hawkerCentre: order.stallName,
    stallName: itemsSummary || 'No items recorded',
    dishImageUrl: '',
    orderDate: order.OrderDate,
    totalAmount: order.totalAmount,
    status: order.OrderStatus,
  };
}

function createOrderCard(order) {
  const card = document.createElement('article');
  card.className = 'order-card';
  card.dataset.status = order.status;

  card.innerHTML = `
    <div class="order-card__image">
      ${order.dishImageUrl
        ? `<img src="${order.dishImageUrl}" alt="${order.stallName}" />`
        : 'Dish img'}
    </div>
    <div class="order-card__body">
      <div class="order-card__top">
        <div class="order-card__heading">
          <h2 class="order-card__hawker">${order.hawkerCentre}</h2>
          <p class="order-card__stall">${order.stallName}</p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <span class="order-card__id">Order: #${order.orderId}</span>
          <span class="order-card__status order-card__status--${order.status}">${order.status}</span>
        </div>
      </div>
      <div class="order-card__meta">
        <div>
          <p class="order-card__meta-label">Order Date:</p>
          <p class="order-card__meta-value">${formatOrderDate(order.orderDate)}</p>
        </div>
        <div>
          <p class="order-card__meta-label">Total Amount:</p>
          <p class="order-card__meta-value">${formatCurrency(order.totalAmount)}</p>
        </div>
      </div>
    </div>
  `;

  return card;
}

function renderOrders(orders) {
  orderListEl.innerHTML = '';

  if (!orders.length) {
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;
  const fragment = document.createDocumentFragment();
  orders.forEach((order) => fragment.appendChild(createOrderCard(order)));
  orderListEl.appendChild(fragment);
}

async function fetchOrders(status) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);

  const response = await fetch(`${API_BASE_URL}/orders/history?${params.toString()}`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    window.location.href = 'login.html';
    return [];
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`);
  }

  const data = await response.json();
  return data.orders.map(mapOrder);
}

async function loadOrders(status = 'all') {
  try {
    const orders = await fetchOrders(status);
    renderOrders(orders);
  } catch (error) {
    console.warn('Falling back to local sample orders:', error.message);
    const filtered = status === 'all'
      ? FALLBACK_ORDERS
      : FALLBACK_ORDERS.filter((order) => order.status === status);
    renderOrders(filtered);
  }
}

filterFormEl.addEventListener('submit', (event) => {
  event.preventDefault();
  loadOrders(statusFilterEl.value);
});

statusFilterEl.addEventListener('change', () => {
  loadOrders(statusFilterEl.value);
});

loadOrders('all');
