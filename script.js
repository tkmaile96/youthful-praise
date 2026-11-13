// ============================================
// YOUTHFUL PRAISE – Single event ticket site
// ============================================

const EVENT = {
  title: "Youthful Praise",
  date: "2026-12-22",
  time: "18:00",
  doors: "17:00",
  venue: "Zimmerman Church of the Nazarene, Mkhululine",
  price: 30,
  currency: "R",
};

// Admin notification email (every purchase is sent here)
const ADMIN_EMAIL = "pinohlungwane@gmail.com";

// Admin password – change this to something only you know
const ADMIN_PASSWORD = "ypadmin2026";

// --------------------------------------------
// EMAILJS SETUP (required for real emails)
// 1. Go to https://www.emailjs.com and create a free account
// 2. Add an Email Service (Gmail is fine)
// 3. Create TWO email templates (see instructions at bottom of this file)
// 4. Paste your keys below
// --------------------------------------------
const EMAILJS_PUBLIC_KEY = "cSXjK8ZSwnTPI4Uy9";      // e.g. "AbCdEfGhIjK..."
const EMAILJS_SERVICE_ID = "service_wde8y0j";      // e.g. "service_xxxxx"
const EMAILJS_TEMPLATE_BUYER = "template_bw48z7g"; // template for the customer
const EMAILJS_TEMPLATE_ADMIN = "template_ixjoecn"; // template for pinohlungwane@gmail.com

// Basket
let basketQty = 0;
let homeQty = 1;
let adminUnlocked = sessionStorage.getItem("ypAdminUnlocked") === "1";

// ============================================
// PAGE NAVIGATION
// ============================================
function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.remove("hidden");

  if (page === "my-tickets") renderMyTickets();
  if (page === "seller") loadSellerSettings();
  if (page === "checkout") renderOrderSummary();
  if (page === "admin") renderAdmin();

  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("cart-overlay").classList.add("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleMobileNav() {
  document.getElementById("mobile-nav").classList.toggle("hidden");
}

// ============================================
// HOME QUANTITY SELECTOR
// ============================================
function changeHomeQty(delta) {
  homeQty = Math.max(1, Math.min(50, homeQty + delta));
  document.getElementById("home-qty").textContent = homeQty;
  document.getElementById("home-total").textContent = `R${homeQty * EVENT.price}`;
}

function addToCartFromHome() {
  basketQty += homeQty;
  homeQty = 1;
  document.getElementById("home-qty").textContent = "1";
  document.getElementById("home-total").textContent = `R${EVENT.price}`;
  updateCartUI();
  openCart();
}

// ============================================
// BASKET / CART
// ============================================
function toggleCart() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (drawer.classList.contains("open")) {
    drawer.classList.remove("open");
    overlay.classList.add("hidden");
  } else {
    openCart();
  }
}

function openCart() {
  renderCartItems();
  document.getElementById("cart-drawer").classList.add("open");
  document.getElementById("cart-overlay").classList.remove("hidden");
}

function updateCartUI() {
  const countEl = document.getElementById("cart-count");
  if (basketQty > 0) {
    countEl.textContent = basketQty;
    countEl.classList.remove("hidden");
  } else {
    countEl.classList.add("hidden");
  }
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById("cart-items");
  const checkoutBtn = document.getElementById("checkout-from-cart");
  const totalEl = document.getElementById("cart-total-amount");

  if (basketQty === 0) {
    container.innerHTML = `<p class="cart-empty">Your basket is empty.<br />Add tickets from the event page.</p>`;
    totalEl.textContent = "R0";
    checkoutBtn.disabled = true;
    return;
  }

  const total = basketQty * EVENT.price;
  container.innerHTML = `
    <div class="cart-line">
      <div class="cart-line-info">
        <h4>${EVENT.title}</h4>
        <p>22 Dec 2026 · 18:00<br />Zimmerman Church · Mkhululine</p>
        <p style="margin-top:6px;">R${EVENT.price} each</p>
      </div>
      <div class="cart-line-actions">
        <div class="qty-controls">
          <button type="button" onclick="changeBasketQty(-1)">−</button>
          <span>${basketQty}</span>
          <button type="button" onclick="changeBasketQty(1)">+</button>
        </div>
        <button class="remove-line" onclick="clearBasket()">Remove</button>
      </div>
    </div>
  `;
  totalEl.textContent = `R${total}`;
  checkoutBtn.disabled = false;
}

function changeBasketQty(delta) {
  basketQty = Math.max(0, Math.min(50, basketQty + delta));
  updateCartUI();
}

function clearBasket() {
  basketQty = 0;
  updateCartUI();
}

function goToCheckoutFromCart() {
  if (basketQty === 0) return;
  toggleCart();
  showPage("checkout");
}

// ============================================
// CHECKOUT + EMAIL
// ============================================
function renderOrderSummary() {
  const summary = document.getElementById("order-summary");
  const total = basketQty * EVENT.price;
  summary.innerHTML = `
    <div class="order-line">
      <span>${basketQty}× Youthful Praise ticket</span>
      <span>R${total}</span>
    </div>
    <div class="order-line" style="color:var(--text-muted);font-size:0.85rem;">
      <span>22 Dec 2026 · Zimmerman Church</span>
      <span></span>
    </div>
    <div class="order-total">
      <span>Total</span>
      <span>R${total}</span>
    </div>
  `;
  document.getElementById("pay-amount").textContent = `R${total}`;
}

function processPayment(e) {
  e.preventDefault();

  if (basketQty === 0) {
    alert("Your basket is empty.");
    return;
  }

  const name = document.getElementById("buyer-name").value.trim();
  const email = document.getElementById("buyer-email").value.trim();
  const phone = document.getElementById("buyer-phone").value.trim();

  if (!name || !email) {
    alert("Please fill in your name and email.");
    return;
  }

  const btn = document.getElementById("pay-btn");
  btn.disabled = true;
  btn.textContent = "Processing…";

  const order = {
    id: "YP-" + Date.now().toString(36).toUpperCase(),
    event: EVENT.title,
    date: EVENT.date,
    time: EVENT.time,
    venue: EVENT.venue,
    qty: basketQty,
    total: basketQty * EVENT.price,
    buyer: { name, email, phone },
    createdAt: new Date().toISOString(),
  };

  // Save for "My Tickets" (this browser)
  const myTickets = JSON.parse(localStorage.getItem("ypTickets") || "[]");
  myTickets.unshift(order);
  localStorage.setItem("ypTickets", JSON.stringify(myTickets));

  // Save for Admin dashboard (this browser)
  const allOrders = JSON.parse(localStorage.getItem("ypAllOrders") || "[]");
  allOrders.unshift(order);
  localStorage.setItem("ypAllOrders", JSON.stringify(allOrders));

  // Send emails (buyer confirmation + admin notification)
  sendPurchaseEmails(order)
    .then(() => {
      basketQty = 0;
      updateCartUI();
      showSuccess(order);
    })
    .catch((err) => {
      console.warn("Email send issue:", err);
      // Still show success – order is saved; emails may need EmailJS setup
      basketQty = 0;
      updateCartUI();
      showSuccess(order, true);
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = `Pay <span id="pay-amount">R0</span>`;
    });
}

/**
 * Sends two emails via EmailJS:
 * 1. Confirmation to the buyer
 * 2. Notification to ADMIN_EMAIL (pinohlungwane@gmail.com)
 */
function sendPurchaseEmails(order) {
  // If keys are not configured yet, skip real send and resolve
  if (
    EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY" ||
    !window.emailjs
  ) {
    console.info(
      "EmailJS not configured yet. Order saved locally. " +
        "Follow the setup steps in script.js to enable real emails."
    );
    return Promise.resolve({ skipped: true });
  }

  emailjs.init(EMAILJS_PUBLIC_KEY);

  const common = {
    order_id: order.id,
    event_name: order.event,
    event_date: "22 December 2026",
    event_time: order.time,
    venue: order.venue,
    qty: String(order.qty),
    total: "R" + order.total,
    buyer_name: order.buyer.name,
    buyer_email: order.buyer.email,
    buyer_phone: order.buyer.phone || "Not provided",
    purchase_time: new Date(order.createdAt).toLocaleString("en-ZA"),
  };

  // Email to buyer
  const buyerPromise = emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_BUYER, {
    ...common,
    to_email: order.buyer.email,
    to_name: order.buyer.name,
  });

  // Email to admin (pinohlungwane@gmail.com)
  const adminPromise = emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ADMIN, {
    ...common,
    to_email: ADMIN_EMAIL,
    to_name: "Youthful Praise Admin",
  });

  return Promise.all([buyerPromise, adminPromise]);
}

function showSuccess(order, emailSkipped) {
  const details = document.getElementById("success-details");
  details.innerHTML = `
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Event:</strong> ${order.event}</p>
    <p><strong>Tickets:</strong> ${order.qty}</p>
    <p><strong>Buyer:</strong> ${order.buyer.name} (${order.buyer.email})</p>
    <p><strong>Total paid:</strong> R${order.total}</p>
    <p style="margin-top:10px;color:var(--text-muted);font-size:0.85rem;">
      See you on 22 December 2026 at Zimmerman Church of the Nazarene, Mkhululine.
    </p>
    ${
      emailSkipped
        ? `<p style="margin-top:10px;color:#fbbf24;font-size:0.85rem;">
            Note: Email service is not fully connected yet. Your order is saved.
            The owner will still receive orders once EmailJS is set up.
          </p>`
        : `<p style="margin-top:10px;color:var(--success);font-size:0.85rem;">
            A confirmation has been sent to ${order.buyer.email}.
          </p>`
    }
  `;
  showPage("success");
}

// ============================================
// MY TICKETS
// ============================================
function renderMyTickets() {
  const list = document.getElementById("my-tickets-list");
  const tickets = JSON.parse(localStorage.getItem("ypTickets") || "[]");

  if (!tickets.length) {
    list.innerHTML = `<p style="color:var(--text-muted);padding:40px 0;text-align:center;">You have no tickets yet. Add some from the Event page!</p>`;
    return;
  }

  list.innerHTML = tickets
    .map(
      (t) => `
    <div class="ticket-item">
      <div>
        <h4>${t.event}</h4>
        <p>22 Dec 2026 · 18:00 · Zimmerman Church, Mkhululine</p>
        <p>${t.qty} ticket${t.qty > 1 ? "s" : ""} · R${t.total}</p>
      </div>
      <div class="ticket-code">${t.id}</div>
    </div>
  `
    )
    .join("");
}

// ============================================
// ADMIN DASHBOARD
// ============================================
function renderAdmin() {
  if (adminUnlocked) {
    document.getElementById("admin-login").classList.add("hidden");
    document.getElementById("admin-panel").classList.remove("hidden");
    loadAdminStats();
  } else {
    document.getElementById("admin-login").classList.remove("hidden");
    document.getElementById("admin-panel").classList.add("hidden");
    document.getElementById("admin-login-error").classList.add("hidden");
  }
}

function adminLogin() {
  const input = document.getElementById("admin-password").value;
  if (input === ADMIN_PASSWORD) {
    adminUnlocked = true;
    sessionStorage.setItem("ypAdminUnlocked", "1");
    document.getElementById("admin-password").value = "";
    renderAdmin();
  } else {
    document.getElementById("admin-login-error").classList.remove("hidden");
  }
}

function adminLogout() {
  adminUnlocked = false;
  sessionStorage.removeItem("ypAdminUnlocked");
  renderAdmin();
}

function loadAdminStats() {
  const orders = JSON.parse(localStorage.getItem("ypAllOrders") || "[]");
  const totalTickets = orders.reduce((sum, o) => sum + (o.qty || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  document.getElementById("stat-orders").textContent = orders.length;
  document.getElementById("stat-tickets").textContent = totalTickets;
  document.getElementById("stat-revenue").textContent = "R" + totalRevenue;

  const list = document.getElementById("admin-orders-list");
  if (!orders.length) {
    list.innerHTML = `<p style="color:var(--text-muted);padding:20px 0;">No purchases recorded in this browser yet.</p>`;
    return;
  }

  list.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Buyer</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Tickets</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${orders
            .map(
              (o) => `
            <tr>
              <td><code>${o.id}</code></td>
              <td>${new Date(o.createdAt).toLocaleString("en-ZA")}</td>
              <td>${o.buyer.name}</td>
              <td>${o.buyer.email}</td>
              <td>${o.buyer.phone || "—"}</td>
              <td>${o.qty}</td>
              <td>R${o.total}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function exportOrdersCSV() {
  const orders = JSON.parse(localStorage.getItem("ypAllOrders") || "[]");
  if (!orders.length) {
    alert("No orders to export.");
    return;
  }
  const header = "Order ID,Purchase Time,Buyer Name,Email,Phone,Tickets,Total\n";
  const rows = orders
    .map(
      (o) =>
        `"${o.id}","${o.createdAt}","${o.buyer.name}","${o.buyer.email}","${
          o.buyer.phone || ""
        }",${o.qty},${o.total}`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "youthful-praise-orders.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// SELLER SETTINGS
// ============================================
function saveSellerSettings() {
  const settings = {
    provider: document.getElementById("payment-provider").value,
    key: document.getElementById("provider-key").value.trim(),
    email: document.getElementById("payout-email").value.trim(),
  };
  localStorage.setItem("ypSellerSettings", JSON.stringify(settings));
  const msg = document.getElementById("seller-save-msg");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 3000);
}

function loadSellerSettings() {
  const raw = localStorage.getItem("ypSellerSettings");
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (s.provider) document.getElementById("payment-provider").value = s.provider;
    if (s.key) document.getElementById("provider-key").value = s.key;
    if (s.email) document.getElementById("payout-email").value = s.email;
  } catch (e) {}
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  showPage("home");
});

/*
============================================
HOW TO ENABLE REAL EMAILS (EmailJS – free)
============================================

1. Go to https://www.emailjs.com and sign up (free – 200 emails/month).

2. Add an Email Service:
   - Click Email Services → Add New Service → choose Gmail
   - Connect the Gmail account that will SEND the emails
     (can be pinohlungwane@gmail.com or another account)

3. Create TWO templates:

   TEMPLATE A – Buyer confirmation
   - Name it e.g. "buyer_confirmation"
   - To Email: {{to_email}}
   - Subject: Your Youthful Praise tickets – {{order_id}}
   - Body example:
     Hi {{buyer_name}},

     Thank you for purchasing {{qty}} ticket(s) for Youthful Praise!

     Order ID: {{order_id}}
     Event: {{event_name}}
     Date: {{event_date}} at {{event_time}}
     Venue: {{venue}}
     Total: {{total}}

     See you there!
     – Youthful Praise

   TEMPLATE B – Admin notification
   - Name it e.g. "admin_notification"
   - To Email: {{to_email}}   (or hardcode pinohlungwane@gmail.com)
   - Subject: New ticket order {{order_id}} – {{qty}} tickets
   - Body example:
     New purchase received.

     Order ID: {{order_id}}
     Buyer: {{buyer_name}}
     Email: {{buyer_email}}
     Phone: {{buyer_phone}}
     Tickets: {{qty}}
     Total: {{total}}
     Time: {{purchase_time}}

4. In this file (script.js) replace:
   EMAILJS_PUBLIC_KEY
   EMAILJS_SERVICE_ID
   EMAILJS_TEMPLATE_BUYER
   EMAILJS_TEMPLATE_ADMIN

   with the values from your EmailJS dashboard.

5. Re-upload the site. Every purchase will then email the buyer
   AND pinohlungwane@gmail.com automatically.
*/
