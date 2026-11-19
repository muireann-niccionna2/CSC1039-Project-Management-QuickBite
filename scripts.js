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

    if (!/^[^@\s]+@mail\.dcu\.ie$/.test(email)) {
      showMessage("Use your student email: name@mail.dcu.ie.", "error");
      return;
    }

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
    if (!/^[^@\s]+@mail\.dcu\.ie$/.test(email)) {
      showMessage("Use your student email: name@mail.dcu.ie.", "error");
      return;
    }
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

  initStudentOrders();
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
    let customerEmail = "";
    try {
      const user = JSON.parse(localStorage.getItem("qb_currentUser"));
      if (user) {
        customer = user.name;
        customerEmail = user.email || "";
      }
    } catch (e) {}

    orders.push({
      number: number,
      items: cart,
      total: cartTotal(cart),
      customer: customer,
      customerEmail: customerEmail,
      time: new Date().toLocaleTimeString(),
      status: "new"
    });
    localStorage.setItem("qb_orders", JSON.stringify(orders));
    if (!customerEmail) {
      const guestOrders = readList("qb_guestOrders");
      guestOrders.push(number);
      localStorage.setItem("qb_guestOrders", JSON.stringify(guestOrders));
    }
    localStorage.removeItem("qb_cart");

    document.getElementById("orderNumber").textContent = "#" + number;
    document.getElementById("checkoutView").classList.add("hidden");
    document.getElementById("confirmView").classList.remove("hidden");
  }

  document.getElementById("payBtn").addEventListener("click", pay);
  showSummary();
}

// ========== Kitchen orders ==========

function initSeeOrders() {
  // Show checkout orders when available; otherwise retain the sample kitchen view.
  const samples = [
    {
      id: 101,
      food: "Chicken Sandwich",
      quantity: 2,
      total: 10.00,
      status: "Pending"
    },
    {
      id: 102,
      food: "Cheeseburger and Coffee",
      quantity: 2,
      total: 10.50,
      status: "Preparing"
    },
    {
      id: 103,
      food: "Chocolate Muffin",
      quantity: 1,
      total: 2.50,
      status: "Ready"
    }
  ];

  const savedOrders = readList("qb_orders");
  const orders = savedOrders.length ? savedOrders.map(order => ({
    id: order.number,
    food: order.items.map(item => item.name).join(", "),
    quantity: order.items.reduce((total, item) => total + item.qty, 0),
    total: order.total,
    status: orderStatus(order)
  })) : samples;
  const orderList = document.getElementById("orders");

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const item = document.createElement("div");
    item.className = "order-item";

    const number = document.createElement("h3");
    number.textContent = "Order #" + order.id;
    const food = document.createElement("p");
    food.textContent = "Food: " + order.food;
    const quantity = document.createElement("p");
    quantity.textContent = "Quantity: " + order.quantity;
    const total = document.createElement("p");
    total.textContent = "Total: €" + order.total.toFixed(2);
    const status = document.createElement("p");
    status.textContent = "Status: " + order.status;

    if (order.status === "Pending") {
      status.className = "pending";
    } else if (order.status === "Preparing" || order.status === "In progress") {
      status.className = "preparing";
    } else {
      status.className = order.status === "Cancelled" ? "cancelled" : "ready";
    }

    item.appendChild(number);
    item.appendChild(food);
    item.appendChild(quantity);
    item.appendChild(total);
    item.appendChild(status);
    orderList.appendChild(item);
  }
}

// ========== Staff log in ==========


function initStaffLogin() {
  // Staff don't sign up: the café manager creates their accounts.
  // Prototype only: demo accounts with plain-text passwords.
  const STAFF_ACCOUNTS = [
    { name: "Aoife", email: "aoife@dcu.ie", password: "cafe123" },
    { name: "Conor", email: "conor@dcu.ie", password: "cafe456" }
  ];
  const STAFF_HOME = "prepare-orders.html";

  function showMessage(text, type) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.className = "message " + type;
  }

  function logIn(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const member = STAFF_ACCOUNTS.find(m => m.email === email && m.password === password);

    if (!member) {
      showMessage("Incorrect email or password.", "error");
      return;
    }

    localStorage.setItem("qb_currentStaff", JSON.stringify({ name: member.name, email: member.email }));
    showMessage("Welcome, " + member.name + "! Taking you to the orders...", "success");
    setTimeout(() => { window.location.href = STAFF_HOME; }, 1000);
  }

  document.getElementById("loginForm").addEventListener("submit", logIn);
}
// ========== Home page ==========

function initHome() {
  // If someone is already logged in, offer a shortcut so they don't have to log in again.
  const message = document.getElementById("continueMessage");

  function readUser(name) {
    try {
      return JSON.parse(localStorage.getItem(name));
    } catch (e) {
      return null;
    }
  }

  const staff = readUser("qb_currentStaff");
  const student = readUser("qb_currentUser");

  let text = "";
  let link = "";
  if (staff) {
    text = "Logged in as " + staff.name + " (staff). ";
    link = "prepare-orders.html";
  } else if (student) {
    text = "Logged in as " + student.name + ". ";
    link = "menu.html";
  }

  if (link) {
    message.textContent = text;
    const continueLink = document.createElement("a");
    continueLink.href = link;
    continueLink.textContent = "Continue →";
    message.appendChild(continueLink);
    message.classList.remove("hidden");
  }
}

// ========== Order preparation and student notifications ==========

function readAccount(key) {
  try {
    const account = JSON.parse(localStorage.getItem(key));
    return account && typeof account.email === "string" && account.email ? account : null;
  } catch (e) {
    return null;
  }
}

function orderStatus(order) {
  const statuses = {
    new: "Pending", Pending: "Pending",
    Preparing: "In progress", "In progress": "In progress",
    Ready: "Ready", Cancelled: "Cancelled"
  };
  return statuses[order.status] || "Pending";
}

function makeOrderCard(order) {
  const card = document.createElement("article");
  card.className = "order-item";
  const heading = document.createElement("h3");
  heading.textContent = "Order #" + order.number;
  card.appendChild(heading);
  order.items.forEach(function (item) {
    const line = document.createElement("p");
    line.textContent = item.qty + " × " + item.name;
    card.appendChild(line);
  });
  const total = document.createElement("p");
  total.textContent = "Total: €" + order.total.toFixed(2);
  card.appendChild(total);
  const status = document.createElement("p");
  status.className = "order-status " + orderStatus(order).toLowerCase().replace(" ", "-");
  status.textContent = "Status: " + orderStatus(order);
  card.appendChild(status);
  return card;
}

function initPrepareOrders() {
  const view = document.getElementById("prepareView");
  const message = document.getElementById("prepareMessage");

  function render() {
    const staff = readAccount("qb_currentStaff");
    view.classList.toggle("hidden", !staff);
    document.getElementById("staffRequired").classList.toggle("hidden", !!staff);
    const list = document.getElementById("prepareOrders");
    list.innerHTML = "";
    if (!staff) return;

    const orders = readList("qb_orders");
    document.getElementById("noOrders").classList.toggle("hidden", orders.length > 0);
    orders.forEach(function (order) {
      const card = makeOrderCard(order);
      const customer = document.createElement("p");
      customer.textContent = "Student: " + order.customer;
      card.appendChild(customer);
      const state = orderStatus(order);
      if (state === "Ready") {
        const note = document.createElement("p");
        note.textContent = "Ready notification available on the student's menu page.";
        card.appendChild(note);
      }
      if (state !== "Ready" && state !== "Cancelled") {
        const actions = document.createElement("div");
        actions.className = "order-actions";
        ["In progress", "Ready", "Cancelled"].forEach(function (nextStatus) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = nextStatus === "Ready" ? "Mark ready & notify" : "Mark " + nextStatus.toLowerCase();
          button.disabled = state === nextStatus;
          button.setAttribute("aria-label", button.textContent + " for order " + order.number);
          button.addEventListener("click", function () {
            // Re-read before saving so updates to other orders in another tab survive.
            if (!readAccount("qb_currentStaff")) { render(); return; }
            const latest = readList("qb_orders");
            const current = latest.find(item => item.number === order.number);
            if (!current || ["Ready", "Cancelled"].includes(orderStatus(current))) {
              message.textContent = "This order has changed. The list has been refreshed.";
              render();
              return;
            }
            current.status = nextStatus;
            current.updatedAt = new Date().toISOString();
            if (nextStatus === "Ready") current.notifiedAt = current.updatedAt;
            localStorage.setItem("qb_orders", JSON.stringify(latest));
            message.textContent = "Order #" + order.number + (nextStatus === "Ready"
              ? " is ready. A collection notification is available on the student's menu page."
              : " marked " + nextStatus.toLowerCase() + ".");
            render();
          });
          actions.appendChild(button);
        });
        card.appendChild(actions);
      }
      list.appendChild(card);
    });
  }

  render();
  window.addEventListener("storage", render);
  window.addEventListener("focus", render);
}

function initStudentOrders() {
  function render() {
    const student = readAccount("qb_currentUser");
    const guestOrders = readList("qb_guestOrders");
    const orders = readList("qb_orders").filter(order => student
      ? order.customerEmail === student.email
      : !order.customerEmail && guestOrders.includes(order.number));
    document.getElementById("studentOrders").classList.toggle("hidden", orders.length === 0);
    const list = document.getElementById("studentOrderList");
    list.innerHTML = "";
    orders.forEach(function (order) {
      const card = makeOrderCard(order);
      if (orderStatus(order) === "Ready") {
        const notification = document.createElement("p");
        notification.className = "ready-notification";
        notification.textContent = "Your order #" + order.number + " is ready! Please collect it from the café.";
        card.appendChild(notification);
      }
      list.appendChild(card);
    });
  }

  render();
  window.addEventListener("storage", render);
  window.addEventListener("focus", render);
}

// ========== Page initialization ==========

if (document.body.classList.contains("staff-login-page")) {
  initStaffLogin();
} else if (document.body.classList.contains("login-page")) {
  initLogin();
} else if (document.body.classList.contains("menu-page")) {
  initMenu();
} else if (document.body.classList.contains("cart-page")) {
  initCart();
} else if (document.body.classList.contains("payment-page")) {
  initCheckout();
} else if (document.body.classList.contains("prepare-orders-page")) {
  initPrepareOrders();
} else if (document.body.classList.contains("see-orders-page")) {
  initSeeOrders();
} else if (document.body.classList.contains("home-page")) {
  initHome();
}
