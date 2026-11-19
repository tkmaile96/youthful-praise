// INIT
// ============================================
async function initializeApp() {
	updateCartUI();
	try {
		await refreshAuthState();
	} catch (error) {
		console.error("Could not restore the authentication session:", error);
	}
	showPage("home");
}

initializeApp();
