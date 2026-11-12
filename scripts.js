// QuickBite scripts. Loaded with defer so each page's HTML is ready.

// ========== Shared cart helpers ==========

function readList(name) {
  try {
    const list = JSON.parse(localStorage.getItem(name));
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("qb_cart", JSON.stringify(cart));
}

function cartTotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.qty, 0);
}

// ========== Login and sign up ==========

function initLogin() {
  // Prototype only: accounts, including plain-text passwords, use localStorage.
  // A production app would use a server and hashed passwords.
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("qb_users")) || [];
    } catch (e) {
      return [];
    }
  }

  function showMessage(text, type) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.className = "message " + type;
  }

  function showForm(which) {
    const isLogin = which === "login";
    document.getElementById("loginForm").classList.toggle("hidden", !isLogin);
    document.getElementById("signupForm").classList.toggle("hidden", isLogin);
    document.getElementById("loginTab").classList.toggle("active", isLogin);
    document.getElementById("signupTab").classList.toggle("active", !isLogin);
    showMessage("", "");
  }

  function signUp(event) {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters.", "error");
      return;
    }
    if (password !== confirm) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    const users = getUsers();
    if (users.some(user => user.email === email)) {
      showMessage("An account with this email already exists.", "error");
      return;
    }

    users.push({ name: name, email: email, password: password });
    localStorage.setItem("qb_users", JSON.stringify(users));
    showMessage("Account created! You can now log in.", "success");
    document.getElementById("signupForm").reset();
    setTimeout(() => showForm("login"), 1200);
  }

  function logIn(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const user = getUsers().find(user => user.email === email && user.password === password);

    if (!user) {
      showMessage("Incorrect email or password.", "error");
      return;
    }

    localStorage.setItem("qb_currentUser", JSON.stringify({ name: user.name, email: user.email }));
    showMessage("Welcome, " + user.name + "! Taking you to the menu...", "success");
    setTimeout(() => { window.location.href = "menu.html"; }, 1000);
  }

  document.getElementById("loginTab").addEventListener("click", () => showForm("login"));
  document.getElementById("signupTab").addEventListener("click", () => showForm("signup"));
  document.getElementById("loginForm").addEventListener("submit", logIn);
  document.getElementById("signupForm").addEventListener("submit", signUp);
}

// ========== Cafe menu ==========

function initMenu() {
  let foods = [
    {
      id: 1,
      name: "Chicken Sandwich",
      price: 5.00,
      available: true
    },
    {
      id: 2,
      name: "Cheeseburger",
      price: 7.50,
      available: true
    },
    {
      id: 3,
      name: "Coffee",
      price: 3.00,
      available: true
    },
    {
      id: 4,
      name: "Chocolate Muffin",
      price: 2.50,
      available: false
    }
  ];

  let menu = document.getElementById("menu");

  function updateCartCount() {
    const count = readList("qb_cart").reduce((total, item) => total + item.qty, 0);
    document.getElementById("cartCount").textContent = count;
  }

  updateCartCount();

  for (let i = 0; i < foods.length; i++) {

    let food = foods[i];

    let item = document.createElement("div");
    item.className = "food-item";

    let name = document.createElement("h3");
    name.textContent = food.name;

    let price = document.createElement("p");
    price.className = "price";
    price.textContent = "€" + food.price.toFixed(2);

    let status = document.createElement("p");

    if (food.available == true) {
      status.textContent = "Available";
      status.className = "available";
    } else {
      status.textContent = "Sold Out";
      status.className = "sold-out";
    }

    item.appendChild(name);
    item.appendChild(price);
    item.appendChild(status);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-button";
    addButton.textContent = food.available ? "Add to cart" : "Sold out";
    addButton.disabled = !food.available;
    addButton.addEventListener("click", function () {
      if (!food.available) return;

      const cart = readList("qb_cart");
      const existing = cart.find(item => item.name === food.name);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ name: food.name, price: food.price, qty: 1 });
      }
      saveCart(cart);
      updateCartCount();
      document.getElementById("menuMessage").textContent = food.name + " added to your cart.";
    });
    item.appendChild(addButton);
    menu.appendChild(item);
  }
}

// ========== Cart ==========

function initCart() {
  function renderCart() {
    const cart = readList("qb_cart");
    document.getElementById("cartView").classList.toggle("hidden", cart.length === 0);
    document.getElementById("emptyCart").classList.toggle("hidden", cart.length > 0);
    document.getElementById("cartTotal").textContent = "€" + cartTotal(cart).toFixed(2);

    const items = document.getElementById("cartItems");
    items.innerHTML = "";

    cart.forEach(function (item, index) {
      const row = document.createElement("div");
      row.className = "cart-item";

      const name = document.createElement("h2");
      name.textContent = item.name;
      const price = document.createElement("p");
      price.textContent = "€" + item.price.toFixed(2) + " each · €" + (item.price * item.qty).toFixed(2);
      const controls = document.createElement("div");
      controls.className = "quantity-controls";

      function quantityButton(text, label, change) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.setAttribute("aria-label", label + " " + item.name);
        button.addEventListener("click", function () {
          item.qty += change;
          if (item.qty <= 0) cart.splice(index, 1);
          saveCart(cart);
          renderCart();
        });
        return button;
      }

      const quantity = document.createElement("span");
      quantity.textContent = item.qty;
      quantity.setAttribute("aria-label", "Quantity: " + item.qty);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + item.name);
      remove.addEventListener("click", function () {
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
      });

      controls.appendChild(quantityButton("−", "Decrease quantity of", -1));
      controls.appendChild(quantity);
      controls.appendChild(quantityButton("+", "Increase quantity of", 1));
      controls.appendChild(remove);
      row.appendChild(name);
      row.appendChild(price);
      row.appendChild(controls);
      items.appendChild(row);
    });
  }

  renderCart();
}

// ========== Checkout and confirmation ==========

function initCheckout() {
  // Orders are saved locally for the kitchen view.
  function showSummary() {
    const cart = readList("qb_cart");

    if (cart.length === 0) {
      document.getElementById("checkoutView").classList.add("hidden");
      document.getElementById("emptyView").classList.remove("hidden");
      return;
    }

    const summary = document.getElementById("summary");
    summary.innerHTML = "";
    cart.forEach(function (item) {
      const line = document.createElement("div");
      line.className = "line";
      const name = document.createElement("span");
      name.textContent = item.qty + " × " + item.name;
      const price = document.createElement("span");
      price.textContent = "€" + (item.price * item.qty).toFixed(2);
      line.appendChild(name);
      line.appendChild(price);
      summary.appendChild(line);
    });

    const total = cartTotal(cart).toFixed(2);
    document.getElementById("total").textContent = "€" + total;
    document.getElementById("payBtn").textContent = "Pay €" + total;
  }

  function pay() {
    const cart = readList("qb_cart");
    if (cart.length === 0) return;

    const orders = readList("qb_orders");
    const number = 1001 + orders.length;

    let customer = "Guest";
    try {
      const user = JSON.parse(localStorage.getItem("qb_currentUser"));
      if (user) customer = user.name;
    } catch (e) {}

    orders.push({
      number: number,
      items: cart,
      total: cartTotal(cart),
      customer: customer,
      time: new Date().toLocaleTimeString(),
      status: "new"
    });
    localStorage.setItem("qb_orders", JSON.stringify(orders));
    localStorage.removeItem("qb_cart");

    document.getElementById("orderNumber").textContent = "#" + number;
    document.getElementById("checkoutView").classList.add("hidden");
    document.getElementById("confirmView").classList.remove("hidden");
  }

  document.getElementById("payBtn").addEventListener("click", pay);
  showSummary();
}

// ========== Page initialization ==========

if (document.body.classList.contains("login-page")) {
  initLogin();
} else if (document.body.classList.contains("menu-page")) {
  initMenu();
} else if (document.body.classList.contains("cart-page")) {
  initCart();
} else if (document.body.classList.contains("payment-page")) {
  initCheckout();
}
