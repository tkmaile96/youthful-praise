async function renderAdmin() {
  const status = document.getElementById("admin-status");
  const list = document.getElementById("admin-requests-list");

  if (!supabaseClient) {
    status.textContent = "Configure Supabase to enable administrator access.";
    list.replaceChildren();
    return;
  }
  if (!authUser) {
    status.textContent = "Sign in with an administrator account to review requests.";
    list.replaceChildren();
    return;
  }
  if (!isAdmin) {
    status.textContent = "This account does not have administrator access.";
    list.replaceChildren();
    return;
  }

  status.textContent = "Loading ticket requests...";
  try {
    const { data: requests, error } = await supabaseClient
      .from("ticket_requests")
      .select("id, email, full_name, phone, quantity, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    status.textContent = requests.length ? `${requests.length} request(s)` : "No ticket requests yet.";
    list.replaceChildren();
    requests.forEach((request) => list.appendChild(createRequestRow(request)));
  } catch (error) {
    status.textContent = error.message || "Could not load ticket requests.";
  }
}

function createRequestRow(request) {
  const row = document.createElement("article");
  row.className = "ticket-item";

  const details = document.createElement("div");
  const name = document.createElement("h4");
  name.textContent = request.full_name;
  const email = document.createElement("p");
  email.textContent = request.email;
  const info = document.createElement("p");
  info.textContent = `${request.quantity} ticket(s) · ${request.status} · ${new Date(request.created_at).toLocaleString()}`;
  details.append(name, email, info);
  row.appendChild(details);

  if (request.phone) {
    const phone = document.createElement("p");
    phone.textContent = request.phone;
    details.appendChild(phone);
  }

  if (request.status === "pending") {
    const approveButton = document.createElement("button");
    approveButton.type = "button";
    approveButton.className = "btn btn-primary";
    approveButton.textContent = "Approve and issue tickets";
    approveButton.addEventListener("click", () => approveTicketRequest(request.id, approveButton));
    row.appendChild(approveButton);
  }
  return row;
}

async function approveTicketRequest(requestId, button) {
  if (!isAdmin || !supabaseClient) return;
  button.disabled = true;
  button.textContent = "Approving...";
  try {
    const { error } = await supabaseClient.rpc("approve_ticket_request", { p_request_id: requestId });
    if (error) throw error;
    const { error: emailError } = await supabaseClient.functions.invoke("ticket-notifications", {
      body: { action: "request_approved", request_id: requestId },
    });
    await renderAdmin();
    if (emailError) {
      document.getElementById("admin-status").textContent =
        "Approved and tickets issued, but the ticket email could not be sent.";
    }
  } catch (error) {
    button.disabled = false;
    button.textContent = "Approve and issue tickets";
    document.getElementById("admin-status").textContent = error.message || "Could not approve this request.";
  }
}