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
