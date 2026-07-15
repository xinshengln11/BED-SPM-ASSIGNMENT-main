const API_BASE = "http://localhost:3000/api";

// Auth is an httpOnly JWT cookie set by the server (not readable from JS), so
// `currentUser` here is only a local cache for instant rendering -- the real
// check is the server rejecting `/auth/profile` with 401 if the session is gone.
let currentUser = JSON.parse(localStorage.getItem("makanhubCurrentUser") || "null");

const roleClassMap = {
  "customer": "role-customer",
  "stall owner": "role-stall-owner",
  "operator": "role-operator",
  "nea officer": "role-nea-officer"
};

const roleColorMap = {
  "customer": "#4EC285",
  "stall owner": "#E6AF2E",
  "operator": "#EA4335",
  "nea officer": "#4285F4"
};

function setMessage(text, type = "") {
  const message = document.getElementById("profileMessage");
  message.textContent = text;
  message.className = `message ${type}`;
}

function renderProfile(user) {
  document.getElementById("profileUsername").value = user.username || "";
  document.getElementById("profileEmail").value = user.email || "";
  document.getElementById("profileAddress").value = user.address || "";
  document.getElementById("profilePhone").value = user.phone || "";

  document.getElementById("profileCardUsername").textContent = user.username || "username";
  document.getElementById("profileCardEmail").textContent = user.email || "email@example.com";

  const role = user.role || "customer";
  const badge = document.getElementById("roleBadge");

  badge.textContent = role.replace(/\b\w/g, (letter) => letter.toUpperCase());
  badge.className = `role-badge ${roleClassMap[role] || "role-customer"}`;

  document.getElementById("saveProfileButton").style.background =
    roleColorMap[role] || roleColorMap.customer;

  const avatar = document.getElementById("avatarPreview");

  if (user.photo) {
    avatar.innerHTML = `<img src="${user.photo}" alt="Profile photo">`;
  } else {
    avatar.textContent = "Photo";
  }
}

function clearSession() {
  localStorage.removeItem("makanhubCurrentUser");
  localStorage.removeItem("makanhubDemoMode");
}

async function loadProfile() {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      credentials: "include"
    });

    if (response.status === 401) {
      clearSession();
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) throw new Error();

    const { customer } = await response.json();
    // The API only knows name/email -- keep any locally-stored address/phone/
    // photo/role (set client-side, not persisted server-side) on top of it.
    currentUser = { ...currentUser, username: customer.name, email: customer.email };
    localStorage.setItem("makanhubCurrentUser", JSON.stringify(currentUser));
  } catch {
    // Backend unreachable: FED-only mode, use localStorage until BED is up.
  }

  renderProfile(currentUser);
}

document.getElementById("profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const updatedUser = {
    ...currentUser,
    username: document.getElementById("profileUsername").value.trim(),
    email: document.getElementById("profileEmail").value.trim(),
    address: document.getElementById("profileAddress").value.trim(),
    phone: document.getElementById("profilePhone").value.trim()
  };

  if (!updatedUser.username || !updatedUser.email || !updatedUser.address) {
    setMessage("Username, email and address are required.", "error");
    return;
  }

  try {
    // The API only accepts/persists name + email; address/phone/photo/role
    // stay local-only until those fields exist in the shared schema.
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: updatedUser.username, email: updatedUser.email })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Update failed.");

    currentUser = updatedUser;
  } catch {
    const users = JSON.parse(localStorage.getItem("makanhubUsers") || "[]");

    const index = users.findIndex((user) =>
      user.email === currentUser.email &&
      user.username === currentUser.username
    );

    if (index >= 0) {
      users[index] = updatedUser;
      localStorage.setItem("makanhubUsers", JSON.stringify(users));
    }

    currentUser = updatedUser;
  }

  localStorage.setItem("makanhubCurrentUser", JSON.stringify(currentUser));
  renderProfile(currentUser);
  setMessage("Profile updated successfully.", "success");
});

document.getElementById("profilePhoto").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!["image/jpeg", "image/png"].includes(file.type)) {
    setMessage("Only JPG and PNG images are allowed.", "error");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    setMessage("Image must be 2MB or smaller.", "error");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    currentUser.photo = reader.result;
    localStorage.setItem("makanhubCurrentUser", JSON.stringify(currentUser));
    renderProfile(currentUser);
    setMessage("Photo updated.", "success");
  };

  reader.readAsDataURL(file);
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    // Ignore network errors -- still clear the local session below.
  }

  clearSession();
  window.location.href = "login.html";
});

document.getElementById("deleteAccountButton").addEventListener("click", async () => {
  const confirmed = window.confirm(
    "Delete your account permanently? This cannot be undone."
  );
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_BASE}/auth/account`, {
      method: "DELETE",
      credentials: "include"
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Delete failed.");

    clearSession();
    window.location.href = "signup.html";
  } catch (error) {
    setMessage(error.message || "Failed to delete account.", "error");
  }
});

loadProfile();
