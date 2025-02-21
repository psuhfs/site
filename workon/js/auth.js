// Add event listeners
document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication status on page load
  let authenticated = await apiCallGet(`${BASE_URL}/auth/authenticated`)
  if (!authenticated.ok) {
    alert("You must be logged in to access this page. Redirecting to login page.")
    navigate("/login")
  }
})
