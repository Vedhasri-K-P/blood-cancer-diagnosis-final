// frontend/src/services/api.js

//  CHANGE IS HERE: Linked to your live Render Backend
const API_URL = "https://smart-diagnostic-tool.onrender.com";

const getToken = () => localStorage.getItem("token");

/**
 * Small helper to do fetch and unified error handling.
 * path: string starting with '/' (e.g. '/profile')
 * options: fetch options (method, body, headers etc.)
 */
async function request(path, options = {}) {
  const headers = Object.assign({}, options.headers || {});

  // JSON by default (for non-file requests)
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!res.ok) {
    const err = data?.error || data?.message || (typeof data === "string" ? data : res.statusText);
    throw err;
  }
  return data;
}

// -------------------- AUTH --------------------
export async function signup(name, email, password) {
  return request("/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(email, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// -------------------- PROFILE --------------------
export async function getProfile() {
  return request("/profile", { method: "GET" });
}

export async function updateProfile(profileData) {
  return request("/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

// backward-compatible aliases
export const saveProfile = updateProfile;
export const completeProfile = updateProfile;

// -------------------- CLASSIFY --------------------
export async function classifyImage(formData) {
  // POST /classify
  const data = await request("/classify", {
    method: "POST",
    body: formData, // FormData object (contains the image)
  });

  // Check for invalid image response from backend
  if (data?.message && data.message.toLowerCase().includes("invalid")) {
    return { error: data.message };
  }

  return data;
}