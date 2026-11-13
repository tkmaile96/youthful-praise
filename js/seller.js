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
