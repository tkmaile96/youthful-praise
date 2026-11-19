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
  document.getElementById("buyer-email").value = authUser?.email || "";
}

async function processPayment(e) {
  e.preventDefault();

  if (basketQty === 0) {
    alert("Your basket is empty.");
    return;
  }

  const name = document.getElementById("buyer-name").value.trim();
  const phone = document.getElementById("buyer-phone").value.trim();

  if (!supabaseClient || !authUser) {
    setPageMessage("Sign in before submitting a ticket request.");
    showPage("account");
    return;
  }

  const button = document.getElementById("pay-btn");
  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    const { data, error } = await supabaseClient
      .from("ticket_requests")
      .insert({
        user_id: authUser.id,
        email: authUser.email,
        full_name: name,
        phone,
        quantity: basketQty,
      })
      .select("id, quantity, status, created_at")
      .single();

    if (error) throw error;

    const { error: emailError } = await supabaseClient.functions.invoke("ticket-notifications", {
      body: { action: "request_created", request_id: data.id },
    });

    basketQty = 0;
    updateCartUI();
    showSuccess(data, !emailError);
  } catch (error) {
    setPageMessage(error.message || "Could not submit the request. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = "Submit ticket request";
  }
}

function showSuccess(request, emailSent) {
  const details = document.getElementById("success-details");
  const emailMessage = emailSent
    ? ` A confirmation email was sent to ${authUser.email}.`
    : " We could not send the confirmation email; your request is still recorded.";
  details.textContent = `Request ${request.id} is ${request.status}. ${request.quantity} ticket(s) requested. Check My Tickets for updates.${emailMessage}`;
  showPage("success");
}

function setPageMessage(message) {
  const target = document.getElementById("auth-message");
  if (target) target.textContent = message;
}

// ============================================
