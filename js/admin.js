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
