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
        "Follow js/EMAILJS_SETUP.md to enable real emails."
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
