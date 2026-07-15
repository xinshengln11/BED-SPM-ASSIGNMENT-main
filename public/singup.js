const API_BASE = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const roleSelect = document.getElementById("signupRole");
  const signupButton = document.getElementById("signupButton");
  const passwordInput = document.getElementById("signupPassword");
  const passwordToggle = document.querySelector(
    "[data-toggle-password='signupPassword']"
  );

  function setMessage(text, type = "") {
    const message = document.getElementById("signupMessage");

    if (!message) {
      return;
    }

    message.textContent = text;
    message.className = `message ${type}`;
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getNormalisedRole() {
    return roleSelect.value
      .trim()
      .toLowerCase()
      .replaceAll("_", " ");
  }

  function applyRoleTheme() {
    const role = getNormalisedRole();

    if (role === "customer") {
      roleSelect.style.backgroundColor = "#EAF9F1";
      roleSelect.style.borderColor = "#4EC285";

      signupButton.style.backgroundColor = "#4EC285";
      signupButton.style.color = "#0B1115";
    }

    else if (role === "stall owner") {
      roleSelect.style.backgroundColor = "#FFF7DD";
      roleSelect.style.borderColor = "#E6AF2E";

      signupButton.style.backgroundColor = "#E6AF2E";
      signupButton.style.color = "#0B1115";
    }

    else if (role === "operator") {
      roleSelect.style.backgroundColor = "#FDECEC";
      roleSelect.style.borderColor = "#EA4335";

      signupButton.style.backgroundColor = "#EA4335";
      signupButton.style.color = "#FFFFFF";
    }

    else if (role === "nea officer") {
      roleSelect.style.backgroundColor = "#EAF2FF";
      roleSelect.style.borderColor = "#4285F4";

      signupButton.style.backgroundColor = "#4285F4";
      signupButton.style.color = "#FFFFFF";
    }
  }

  roleSelect.addEventListener("change", applyRoleTheme);

  applyRoleTheme();

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";

      passwordInput.type = isHidden
        ? "text"
        : "password";

      passwordToggle.textContent = isHidden
        ? "Hide"
        : "Show";
    });
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const account = {
      username: document
        .getElementById("signupUsername")
        .value
        .trim(),

      email: document
        .getElementById("signupEmail")
        .value
        .trim(),

      address: document
        .getElementById("signupAddress")
        .value
        .trim(),

      role: getNormalisedRole(),

      password: passwordInput.value
    };

    if (!account.username) {
      setMessage(
        "Please enter a username.",
        "error"
      );
      return;
    }

    if (!validEmail(account.email)) {
      setMessage(
        "Please enter a valid email address.",
        "error"
      );
      return;
    }

    if (!account.address) {
      setMessage(
        "Please enter your address.",
        "error"
      );
      return;
    }

    if (account.password.length < 8) {
      setMessage(
        "Password needs at least 8 characters.",
        "error"
      );
      return;
    }

    if (account.role === "stall owner") {
      sessionStorage.setItem(
        "pendingVendorAccount",
        JSON.stringify(account)
      );

      window.location.href = "signup-vendor.html";
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(account)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed."
        );
      }

      setMessage(
        "Account created successfully.",
        "success"
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    }

    catch (error) {
      const users = JSON.parse(
        localStorage.getItem("makanhubUsers") || "[]"
      );

      const duplicate = users.some((user) => {
        return (
          user.username.toLowerCase() ===
            account.username.toLowerCase() ||

          user.email.toLowerCase() ===
            account.email.toLowerCase()
        );
      });

      if (duplicate) {
        setMessage(
          "Username or email already exists.",
          "error"
        );
        return;
      }

      users.push({
        ...account,
        phone: "",
        photo: ""
      });

      localStorage.setItem(
        "makanhubUsers",
        JSON.stringify(users)
      );

      setMessage(
        "Demo account created successfully.",
        "success"
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    }
  });
});