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
