const API_BASE = "http://localhost:3000/api";

function setMessage(text, type = "") {
  const message = document.getElementById("vendorSignupMessage");
  message.textContent = text;
  message.className = `message ${type}`;
}

const pendingVendorAccount = JSON.parse(
  sessionStorage.getItem("pendingVendorAccount") || "null"
);

if (!pendingVendorAccount) {
  window.location.href = "signup.html";
}

document.getElementById("vendorSignupForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    ...pendingVendorAccount,
    stall: {
      stallName: document.getElementById("stallName").value.trim(),
      stallUnitNo: document.getElementById("stallUnitNo").value.trim(),
      hawkerCentre: document.getElementById("hawkerCentre").value,
      stallDescription: document.getElementById("stallDescription").value.trim()
    }
  };

  if (!payload.stall.stallName || !payload.stall.stallUnitNo || !payload.stall.stallDescription) {
    setMessage("Complete all stall details.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register-vendor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Vendor registration failed.");

    sessionStorage.removeItem("pendingVendorAccount");
    setMessage("Vendor and stall registered successfully.", "success");
    setTimeout(() => window.location.href = "login.html", 800);
  } catch {
    const users = JSON.parse(localStorage.getItem("makanhubUsers") || "[]");

    const duplicate = users.some((user) =>
      user.username.toLowerCase() === payload.username.toLowerCase() ||
      user.email.toLowerCase() === payload.email.toLowerCase()
    );

    if (duplicate) {
      setMessage("Username or email already exists.", "error");
      return;
    }

    users.push({ ...payload, phone: "", photo: "" });
    localStorage.setItem("makanhubUsers", JSON.stringify(users));
    sessionStorage.removeItem("pendingVendorAccount");

    setMessage("Demo vendor account created successfully.", "success");
    setTimeout(() => window.location.href = "login.html", 800);
  }
});