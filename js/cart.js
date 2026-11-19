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
  if (supabaseClient && !authUser) {
    setPageMessage("Sign in or create an account to request tickets.");
    showPage("account");
    return;
  }
  showPage("checkout");
}

// ============================================
