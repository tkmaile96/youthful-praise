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

const SUPABASE_URL = "https://gqzhquseijhmeboisihy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-2gMMA9CPV485YOiyklyAA_YxUqtzSq";

const supabaseClient = window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Basket
let basketQty = 0;
let homeQty = 1;
let authUser = null;
let isAdmin = false;

// ============================================
