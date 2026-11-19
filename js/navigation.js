// PAGE NAVIGATION
// ============================================
function showPage(page) {
  if (page === "admin" && (!authUser || !isAdmin)) {
    showPage("account");
    setPageMessage(authUser ? "This account does not have administrator access." : "Sign in with an administrator account to continue.");
    return;
  }

  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.remove("hidden");

  if (page === "my-tickets") renderMyTickets();
  if (page === "seller") loadSellerSettings();
  if (page === "checkout") renderOrderSummary();
  if (page === "account") renderAuth();
  if (page === "admin") renderAdmin();

  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("cart-overlay").classList.add("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleMobileNav() {
  document.getElementById("mobile-nav").classList.toggle("hidden");
}

// ============================================
