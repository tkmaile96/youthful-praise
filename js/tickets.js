async function renderMyTickets() {
  const list = document.getElementById("my-tickets-list");
  list.replaceChildren();

  if (!supabaseClient) {
    list.textContent = "Configure Supabase to access ticket requests and issued tickets.";
    return;
  }
  if (!authUser) {
    list.textContent = "Sign in to see your requests and tickets.";
    return;
  }

  const pendingHeading = document.createElement("h3");
  pendingHeading.textContent = "Ticket requests";
  list.appendChild(pendingHeading);

  const { data: requests, error: requestsError } = await supabaseClient
    .from("ticket_requests")
    .select("id, full_name, quantity, status, created_at")
    .order("created_at", { ascending: false });
  if (requestsError) {
    list.textContent = requestsError.message;
    return;
  }

  if (!requests.length) {
    const empty = document.createElement("p");
    empty.textContent = "You have no ticket requests yet.";
    list.appendChild(empty);
  }
  requests.forEach((request) => {
    const item = document.createElement("article");
    item.className = "ticket-item";
    const text = document.createElement("p");
    text.textContent = `${request.quantity} ticket(s) · ${request.status} · ${new Date(request.created_at).toLocaleString()}`;
    item.appendChild(text);
    list.appendChild(item);
  });

  const ticketsHeading = document.createElement("h3");
  ticketsHeading.textContent = "Issued tickets";
  list.appendChild(ticketsHeading);
  const { data: tickets, error: ticketsError } = await supabaseClient
    .from("tickets")
    .select("id, request_id, ticket_number, issued_at")
    .order("issued_at", { ascending: false });
  if (ticketsError) {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = ticketsError.message;
    list.appendChild(errorMessage);
    return;
  }

  if (!tickets.length) {
    const empty = document.createElement("p");
    empty.textContent = "Approved tickets will appear here.";
    list.appendChild(empty);
  } else {
    const ticketsWithNames = tickets.map((ticket) => ({
      ...ticket,
      purchaserName: requests.find((request) => request.id === ticket.request_id)?.full_name || authUser.email || "Ticket holder",
    }));
    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "btn btn-outline";
    downloadButton.textContent = "Download tickets";
    downloadButton.addEventListener("click", () => downloadTickets(ticketsWithNames));
    list.appendChild(downloadButton);
  }
  tickets.forEach((ticket) => {
    const item = document.createElement("article");
    item.className = "admission-ticket";
    const details = document.createElement("div");
    details.className = "admission-ticket-main";
    const eyebrow = document.createElement("p");
    eyebrow.className = "admission-ticket-eyebrow";
    eyebrow.textContent = "YOUTHFUL PRAISE · ADMISSION";
    const title = document.createElement("h4");
    title.textContent = EVENT.title;
    const attendee = document.createElement("p");
    attendee.className = "admission-ticket-name";
    attendee.textContent = requests.find((request) => request.id === ticket.request_id)?.full_name || authUser.email || "Ticket holder";
    const eventDetails = document.createElement("p");
    eventDetails.className = "admission-ticket-details";
    eventDetails.textContent = `${new Date(`${EVENT.date}T${EVENT.time}`).toLocaleString()} · ${EVENT.venue}`;
    const issued = document.createElement("p");
    issued.className = "admission-ticket-issued";
    issued.textContent = `Issued ${new Date(ticket.issued_at).toLocaleString()}`;
    details.append(eyebrow, title, attendee, eventDetails, issued);
    const stub = document.createElement("div");
    stub.className = "admission-ticket-stub";
    const stubLabel = document.createElement("span");
    stubLabel.textContent = "TICKET NO.";
    const number = document.createElement("strong");
    number.textContent = `YP-${String(ticket.ticket_number).padStart(6, "0")}`;
    stub.append(stubLabel, number);
    item.append(details, stub);
    list.appendChild(item);
  });
}

function downloadTickets(tickets) {
  const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
  const eventDate = new Date(`${EVENT.date}T${EVENT.time}`).toLocaleString();
  const ticketCards = tickets.map((ticket) => `
    <article class="ticket">
      <div class="ticket-main">
        <p class="eyebrow">YOUTHFUL PRAISE · ADMISSION</p>
        <h2>${escapeHtml(EVENT.title)}</h2>
        <p class="attendee">${escapeHtml(ticket.purchaserName)}</p>
        <p>${escapeHtml(eventDate)}</p>
        <p>${escapeHtml(EVENT.venue)}</p>
      </div>
      <div class="ticket-stub">
        <span>TICKET NO.</span>
        <strong>YP-${String(ticket.ticket_number).padStart(6, "0")}</strong>
      </div>
    </article>
  `).join("");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(EVENT.title)} Tickets</title>
  <style>
    body{font-family:Arial,sans-serif;color:#202020;max-width:760px;margin:32px auto;padding:0 16px}
    h1{font-size:24px}.ticket{display:grid;grid-template-columns:1fr 190px;border:2px solid #202020;margin:20px 0;page-break-inside:avoid;min-height:190px}
    .ticket-main{padding:24px}.eyebrow{font-size:11px;font-weight:bold;letter-spacing:1px;color:#a43b08}
    .ticket h2{font-size:24px;margin:8px 0}.attendee{font-size:18px;font-weight:bold;margin:10px 0}
    .ticket-main p{margin:5px 0}.ticket-stub{border-left:2px dashed #777;padding:22px 14px;display:flex;flex-direction:column;justify-content:center;gap:12px;background:#fff7f0}
    .ticket-stub span{font-size:10px;letter-spacing:1px}.ticket-stub strong{font:700 20px monospace;overflow-wrap:anywhere}
    @media(max-width:520px){.ticket{grid-template-columns:1fr 138px}.ticket-main{padding:16px}.ticket-stub{padding:14px 10px}.ticket-stub strong{font-size:16px}}
    @media print{body{margin:0 auto}.ticket{break-inside:avoid}}
  </style>
</head>
<body>
  <h1>${escapeHtml(EVENT.title)} Tickets</h1>
  ${ticketCards}
</body>
</html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "youthful-praise-tickets.html";
  link.click();
  URL.revokeObjectURL(url);
}