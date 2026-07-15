const API_BASE = "http://localhost:3000/api";

function setMessage(text, type = "") {
  const message = document.getElementById("loginMessage");
  message.textContent = text;
  message.className = `message ${type}`;
}

const passwordInput = document.getElementById("password");
const passwordToggle = document.querySelector("[data-toggle-password='password']");

passwordToggle.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";
  passwordInput.type = hidden ? "text" : "password";
  passwordToggle.textContent = hidden ? "Hide" : "Show";
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const identifier = document.getElementById("identifier").value.trim();
  const password = passwordInput.value;

  if (!identifier || !password) {
    setMessage("Enter your email/username and password.", "error");
    return;
  }

  try {
    // The customer-management API only accounts for email/password logins
    // (no separate username), so the "Email or Username" field is sent as email.
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: identifier, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed.");

    // Auth itself is an httpOnly JWT cookie set by the server (inaccessible to
    // JS by design) -- this local copy is only for showing the user's name/email.
    localStorage.setItem("makanhubCurrentUser", JSON.stringify(data.customer));
    window.location.href = "profile.html";
  } catch {
    const users = JSON.parse(localStorage.getItem("makanhubUsers") || "[]");

    const user = users.find((item) =>
      (item.email.toLowerCase() === identifier.toLowerCase() ||
       item.username.toLowerCase() === identifier.toLowerCase()) &&
      item.password === password
    );

    if (!user) {
      setMessage("Invalid email/username or password.", "error");
      return;
    }

    localStorage.setItem("makanhubCurrentUser", JSON.stringify(user));
    localStorage.setItem("makanhubDemoMode", "1");
    window.location.href = "profile.html";
  }
});
