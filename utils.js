// const BASE_URL = "https://api.ssdd.dev"
const BASE_URL = "http://localhost:3000"

// Function to preserve and transfer query parameters
function navigateWithQueries(path, newParams = {}) {
  if (window.location.href.endsWith(path)) {
    return
  }
  // Get current URL parameters
  const currentParams = new URLSearchParams(window.location.search)

  // Add new parameters while preserving existing ones
  Object.entries(newParams).forEach(([key, value]) => {
    currentParams.set(key, value)
  })

  // Create the new URL with all parameters
  const queryString = currentParams.toString()
  // Navigate to the new URL
  window.location.href = path + (queryString ? `?${queryString}` : "")
}

function navigate(path) {
  if (window.location.pathname.endsWith(path)) {
    return
  }

  window.location.href = path
}

function getNext() {
  const currentParams = new URLSearchParams(window.location.search)
  return currentParams.get("next")
}

async function apiCallPost(url, body) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    credentials: "include",
    body,
  })
}

async function apiCallGet(url) {
  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    credentials: "include",
  })
}

function setToken(token) {
  // Set secure cookie with necessary attributes for cross-origin
  document.cookie = `token=${token}; Path=/; SameSite=None; Secure`
}

function getToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1]
}

function kickOut() {
  alert("You are not allowed to view this page")
  navigate("/login")
}
