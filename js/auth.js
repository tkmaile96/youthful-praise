function renderAuth() {
  const configured = Boolean(supabaseClient);
  document.getElementById("auth-config-notice").classList.toggle("hidden", configured);
  document.getElementById("auth-signed-out").classList.toggle("hidden", !configured || Boolean(authUser));
  document.getElementById("auth-signed-in").classList.toggle("hidden", !authUser);

  const email = document.getElementById("auth-user-email");
  const role = document.getElementById("auth-user-role");
  if (authUser) {
    email.textContent = authUser.email || "Signed-in account";
    role.textContent = isAdmin ? "Administrator" : "Youthful Praise account";
  }

  updateAccountLinks();
  toggleAuthMode();
}

function updateAccountLinks() {
  const label = authUser ? "Account" : "Sign in";
  ["account-nav-link", "account-mobile-link"].forEach((id) => {
    const link = document.getElementById(id);
    if (link) link.textContent = label;
  });
  document.querySelectorAll(".admin-link").forEach((link) => {
    link.classList.toggle("hidden", !isAdmin);
  });
}

function toggleAuthMode() {
  const mode = document.getElementById("auth-mode");
  if (!mode) return;
  const signingUp = mode.value === "signup";
  document.getElementById("auth-name-row").classList.toggle("hidden", !signingUp);
  document.getElementById("auth-name").required = signingUp;
  document.getElementById("auth-password").autocomplete = signingUp ? "new-password" : "current-password";
  document.getElementById("auth-submit").textContent = signingUp ? "Create account" : "Sign in";
}

async function submitAuth(event) {
  event.preventDefault();
  const message = document.getElementById("auth-message");
  const button = document.getElementById("auth-submit");
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const signingUp = document.getElementById("auth-mode").value === "signup";

  message.textContent = "";
  button.disabled = true;

  try {
    const result = signingUp
      ? await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { full_name: document.getElementById("auth-name").value.trim() } },
        })
      : await supabaseClient.auth.signInWithPassword({ email, password });

    if (result.error) throw result.error;

    if (signingUp && !result.data.session) {
      message.textContent = "Account created. Check your email to confirm it, then sign in.";
      return;
    }

    await refreshAuthState();
    message.textContent = signingUp ? "Account created and signed in." : "Signed in.";
    document.getElementById("auth-password").value = "";
    if (basketQty > 0) showPage("checkout");
  } catch (error) {
    message.textContent = error.message || "Authentication failed. Please try again.";
  } finally {
    button.disabled = false;
    toggleAuthMode();
  }
}

async function refreshAuthState() {
  if (!supabaseClient) {
    authUser = null;
    isAdmin = false;
    updateAccountLinks();
    return;
  }

  const { data, error } = await supabaseClient.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") throw error;
  authUser = data.user || null;
  isAdmin = false;

  if (authUser) {
    const { data: membership, error: membershipError } = await supabaseClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", authUser.id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    isAdmin = Boolean(membership);
  }

  renderAuth();
}

async function signOutUser() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    setPageMessage(error.message);
    return;
  }
  authUser = null;
  isAdmin = false;
  renderAuth();
  showPage("home");
}