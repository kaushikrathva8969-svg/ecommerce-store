// ============================================================
// api.js - shared code used by every page
// ============================================================

// Your backend address (PORT in backend/.env is 8008)
const API_URL = "http://localhost:8008/api";

// Razorpay TEST key id (same one used in your old script.js)
const RAZORPAY_KEY = "rzp_test_Tihx8KDZwxYgcR";

// ---------- Login helpers ----------
function saveToken(token) { localStorage.setItem("token", token); }
function getToken() { return localStorage.getItem("token"); }

// 1) in logout(), also remove the role
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}

// Call at the top of pages that need login
function requireLogin() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ---------- Talk to the backend ----------
// Example: const products = await api("/products");
//          await api("/cart", "POST", { productId, quantity: 1 });
async function api(path, method = "GET", body = null) {
  const options = { method: method, headers: { "Content-Type": "application/json" } };

  const token = getToken();
  if (token) options.headers.Authorization = "Bearer " + token;
  if (body) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(API_URL + path, options);
  } catch (error) {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  let data = null;
  try { data = await response.json(); } catch (error) { /* no json body */ }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      throw new Error("Please login again.");
    }
    throw new Error((data && data.message) || "Something went wrong");
  }
  return data;
}

// ---------- Razorpay payment for one order ----------
// Uses your existing routes: /payment/create-order and /payment/verify
function payForOrder(orderId) {
  return new Promise(async function (resolve, reject) {
    try {
      const rzOrder = await api("/payment/create-order", "POST", { orderId });

      const options = {
        key: RAZORPAY_KEY,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        order_id: rzOrder.id,
        name: "Shop",
        handler: async function (response) {
          try {
            await api("/payment/verify", "POST", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: { ondismiss: function () { reject(new Error("Payment cancelled.")); } },
      };

      new Razorpay(options).open();
    } catch (error) {
      reject(error);
    }
  });
}

// ---------- Small helpers ----------
function showMessage(text, type) {
  const box = document.getElementById("message");
  box.textContent = text;
  box.className = "message " + type;
  window.scrollTo(0, 0);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : text;
  return div.innerHTML;
}

function formatMoney(amount) {
  return "\u20B9" + Number(amount || 0).toLocaleString("en-IN");
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Image box used on product cards and product page
function pictureHtml(product) {
  if (product.image) {
    return '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '">';
  }
  return "No image";
}

// Add one product to the cart (used on home page and product page)
async function addToCart(productId, quantity) {
  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }
  try {
    await api("/cart", "POST", { productId, quantity });
    showMessage("Added to cart.", "success");
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function isAdmin() {
  return localStorage.getItem("role") === "admin";
}

// ---------- Navbar ----------
function renderNavbar() {
  let html = '<a class="logo" href="index.html">Shop</a>';
  html += '<a href="index.html">Products</a>';

  if (getToken()) {
    if (localStorage.getItem("role") === "admin") {
      // admin sees only the admin page
      html += '<a href="admin.html">Admin</a>';
    } else {
      // customer sees cart and orders
      html += '<a href="cart.html">Cart</a>';
      html += '<a href="orders.html">My orders</a>';
    }

    html += '<button class="link" onclick="logout()">Logout</button>';
  } else {
    html += '<a href="login.html">Login</a>';
    html += '<a href="register.html">Register</a>';
  }

  document.getElementById("navbar").innerHTML = html;
}

renderNavbar();