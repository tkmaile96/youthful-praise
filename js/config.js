// ============================================
// YOUTHFUL PRAISE – Single event ticket site
// ============================================

const EVENT = {
  title: "Youthful Praise",
  date: "2026-12-22",
  time: "18:00",
  doors: "17:00",
  venue: "Zimmerman Church of the Nazarene, Mkhululine",
  price: 30,
  currency: "R",
};

// Admin notification email (every purchase is sent here)
const ADMIN_EMAIL = "pinohlungwane@gmail.com";

// Admin password – change this to something only you know
const ADMIN_PASSWORD = "ypadmin2026";

// --------------------------------------------
// EMAILJS SETUP (required for real emails)
// 1. Go to https://www.emailjs.com and create a free account
// 2. Add an Email Service (Gmail is fine)
// 3. Create TWO email templates (see EMAILJS_SETUP.md in this folder)
// 4. Paste your keys below
// --------------------------------------------
const EMAILJS_PUBLIC_KEY = "cSXjK8ZSwnTPI4Uy9";      // e.g. "AbCdEfGhIjK..."
const EMAILJS_SERVICE_ID = "service_wde8y0j";      // e.g. "service_xxxxx"
const EMAILJS_TEMPLATE_BUYER = "template_bw48z7g"; // template for the customer
const EMAILJS_TEMPLATE_ADMIN = "template_ixjoecn"; // template for pinohlungwane@gmail.com

// Basket
let basketQty = 0;
let homeQty = 1;
let adminUnlocked = sessionStorage.getItem("ypAdminUnlocked") === "1";

// ============================================
