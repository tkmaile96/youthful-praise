const fragments = [
  { target: "app-header", path: "html/header.html" },
  { target: "app-pages", path: "html/home.html" },
  { target: "app-pages", path: "html/checkout.html" },
  { target: "app-pages", path: "html/success.html" },
  { target: "app-pages", path: "html/my-tickets.html" },
  { target: "app-pages", path: "html/seller.html" },
  { target: "app-pages", path: "html/admin.html" },
  { target: "app-footer", path: "html/footer.html" },
];

const appScripts = [
  "js/config.js",
  "js/navigation.js",
  "js/cart.js",
  "js/checkout.js",
  "js/tickets.js",
  "js/admin.js",
  "js/seller.js",
  "js/init.js",
];

async function loadFragment(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  return response.text();
}

function loadScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = path;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${path}.`));
    document.body.appendChild(script);
  });
}

async function startApp() {
  const loadError = document.getElementById("load-error");

  try {
    const markup = await Promise.all(fragments.map(({ path }) => loadFragment(path)));
    fragments.forEach(({ target }, index) => {
      document.getElementById(target).insertAdjacentHTML("beforeend", markup[index]);
    });

    for (const path of appScripts) await loadScript(path);
  } catch (error) {
    console.error(error);
    loadError.textContent = "The ticket site could not load. Run it from a local web server and refresh.";
    loadError.hidden = false;
  }
}

startApp();