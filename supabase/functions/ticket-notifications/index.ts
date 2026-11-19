import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] || character);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return response({ error: "Sign in required." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("TICKET_EMAIL_FROM");
  const adminEmail = Deno.env.get("TICKET_ADMIN_EMAIL");
  if (!supabaseUrl || !supabaseAnonKey || !resendApiKey || !sender || !adminEmail) {
    return response({ error: "Email service is not configured." }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return response({ error: "Invalid session." }, 401);

    const body = await request.json();
    const action = body?.action;
    const requestId = body?.request_id;
    if (!["request_created", "request_approved"].includes(action) || typeof requestId !== "string") {
      return response({ error: "Invalid notification request." }, 400);
    }

    const { data: ticketRequest, error: requestError } = await supabase
      .from("ticket_requests")
      .select("id, user_id, email, full_name, quantity, status, created_at")
      .eq("id", requestId)
      .single();
    if (requestError || !ticketRequest) return response({ error: "Request not found." }, 404);

    if (action === "request_created") {
      if (ticketRequest.user_id !== userData.user.id || ticketRequest.status !== "pending") {
        return response({ error: "Not allowed." }, 403);
      }
    } else {
      const { data: membership, error: membershipError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (membershipError || !membership) return response({ error: "Admin access required." }, 403);
      if (ticketRequest.status !== "approved") return response({ error: "Request is not approved." }, 409);
    }

    let subject: string;
    let text: string;
    let html: string | undefined;
    if (action === "request_created") {
      subject = `Ticket request received: ${ticketRequest.id}`;
      text = `Hello ${ticketRequest.full_name},\n\nWe received your request for ${ticketRequest.quantity} Youthful Praise ticket(s). Your request is pending payment verification and approval. Tickets are not issued until approval.\n\nEvent: Youthful Praise\nDate: 22 December 2026 at 18:00\nVenue: Zimmerman Church of the Nazarene, Mkhululine\nRequest number: ${ticketRequest.id}\n\nThe Youthful Praise team`;
    } else {
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("ticket_number")
        .eq("request_id", ticketRequest.id)
        .order("ticket_number");
      if (ticketsError || !tickets?.length) return response({ error: "Issued tickets could not be loaded." }, 500);

      subject = "Your Youthful Praise tickets are approved";
      const ticketNumbers = tickets.map((ticket) => `YP-${String(ticket.ticket_number).padStart(6, "0")}`);
      const numbers = ticketNumbers.join("\n");
      text = `Hello ${ticketRequest.full_name},\n\nYour payment has been verified and your ${tickets.length} Youthful Praise ticket(s) have been approved.\n\nTicket number(s):\n${numbers}\n\nEvent: Youthful Praise\nDate: 22 December 2026 at 18:00\nVenue: Zimmerman Church of the Nazarene, Mkhululine\n\nPlease bring your ticket number to the event.\n\nThe Youthful Praise team`;
      const ticketCards = ticketNumbers.map((number) => `
        <div style="border:1px solid #d9d9d9;padding:18px;margin:12px 0;max-width:420px">
          <div style="font-size:12px;color:#555">YOUTHFUL PRAISE · ADMISSION TICKET</div>
          <div style="font-size:24px;font-weight:bold;margin:10px 0">${number}</div>
          <div>22 December 2026 · 18:00</div>
          <div>Zimmerman Church of the Nazarene, Mkhululine</div>
        </div>`).join("");
      html = `<div style="font-family:Arial,sans-serif;color:#222;line-height:1.5">
        <p>Hello ${escapeHtml(ticketRequest.full_name)},</p>
        <p>Your ticket request is approved. Show the ticket number below at the event.</p>
        ${ticketCards}
        <p>Youthful Praise team</p>
      </div>`;
    }

    const messages: Array<{ to: string; subject: string; text: string; html?: string }> = [
      { to: ticketRequest.email, subject, text, html },
    ];
    if (action === "request_created") {
      messages.push({
        to: adminEmail,
        subject: `New ticket request: ${ticketRequest.full_name}`,
        text: `A new ticket request is waiting for review.\n\nName: ${ticketRequest.full_name}\nEmail: ${ticketRequest.email}\nPhone: ${ticketRequest.phone || "Not provided"}\nQuantity: ${ticketRequest.quantity}\nStatus: ${ticketRequest.status}\nRequest number: ${ticketRequest.id}\nSubmitted: ${new Date(ticketRequest.created_at).toLocaleString()}\n\nVerify payment through your agreed payment channel before approving the request.`,
      });
    }

    for (const message of messages) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          ...(message.html ? { html: message.html } : {}),
        }),
      });

      if (!emailResponse.ok) {
        console.error("Resend request failed:", await emailResponse.text());
        return response({ error: "Email provider rejected the message." }, 502);
      }
    }

    return response({ sent: true });
  } catch (error) {
    console.error("Ticket notification failed:", error);
    return response({ error: "Could not send notification." }, 500);
  }
});
