const BASE_URL = "https://api.ssdd.dev"
// const BASE_URL = "http://localhost:3002"

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
  const token = getToken()
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && {Authorization: `Bearer ${token}`}),
    },
    credentials: "include",
    body,
  })
}

async function apiCallGet(url) {
  const token = getToken()
  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && {Authorization: `Bearer ${token}`}),
    },
    credentials: "include",
  })
}

function setToken(token) {
  // Set secure cookie with necessary attributes for cross-origin
  // Add Max-Age for 7 days (604800 seconds) to persist across sessions
  document.cookie = `token=${encodeURIComponent(token)}; Path=/; SameSite=None; Secure; Max-Age=604800`
}

function getToken() {
  const cookieRow = document.cookie.split("; ").find((row) => row.startsWith("token="))

  if (!cookieRow) return undefined

  // Get everything after "token=" to handle JWT tokens with = padding
  return cookieRow.substring(6) // "token=".length === 6
}

async function isHealthy() {
  const resp = await fetch(`${BASE_URL}/health`)
  return resp.ok
}

function kickOut(statusCode) {
  // Only kick out for authentication/authorization errors
  if (statusCode === 401 || statusCode === 403) {
    alert("Your session has expired or you don't have permission. Please log in again.")
    navigate("/login")
  } else {
    alert("An error occurred. Please try again.")
  }
}

// Universal Theme Management
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark-mode")
    if (document.body) {
      document.body.classList.add("dark-mode")
    }
  }
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle")
  if (!themeToggle) return
  
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark-mode")
    document.body.classList.toggle("dark-mode")
    const isDark = document.body.classList.contains("dark-mode")
    localStorage.setItem("theme", isDark ? "dark" : "light")
  })
}

// Initialize theme immediately when script loads (applies to <html> element)
initializeTheme()

// Re-apply to body when it's ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTheme)
} else {
  initializeTheme()
}
