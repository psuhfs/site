// Handle form submission
document.addEventListener("DOMContentLoaded", async () => {
  // Password visibility toggle
  const toggleButtons = document.querySelectorAll(".toggle-password")

  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target")
      const passwordInput = document.getElementById(targetId)
      const eyeIcon = button.querySelector(".eye-icon")
      const eyeOffIcon = button.querySelector(".eye-off-icon")

      if (passwordInput.type === "password") {
        passwordInput.type = "text"
        eyeIcon.style.display = "none"
        eyeOffIcon.style.display = "block"
      } else {
        passwordInput.type = "password"
        eyeIcon.style.display = "block"
        eyeOffIcon.style.display = "none"
      }
    })
  })

  // WARN: DO NOT ADD ANY CODE ABOVE submitHandler() CALL.
  // explanation: upon submitting form, the redirection might add email and password publicly, in queries,
  // so we must wait for submitHandler to initiate before we add ANY code.
  const isServerHealthy = await isHealthy()
  if (!isServerHealthy) {
    navigate("/dashboard")
  }

  submitHandler(isServerHealthy)

  let next = getNext()
  if (!next) {
    // TODO: need to build dashboard
    next = "/dashboard"
  }

  if ((await apiCallGet(`${BASE_URL}/auth/authenticated`)).ok) {
    navigate(next)
  }
})

function submitHandler(isServerHealthy) {
  let next = getNext()
  if (!next) {
    // TODO: need to build dashboard
    next = "/dashboard"
  }

  const loginForm = document.getElementById("loginForm")

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const username = document.getElementById("username").value
    const password = document.getElementById("password").value

    try {
      if (!isServerHealthy) {
        navigate(next)
        return
      }
      const response = await apiCallPost(
        `${BASE_URL}/auth/signin`,
        JSON.stringify({
          username,
          password,
        }),
      )

      const data = await response.json()
      if (!response.ok) {
        alert("Invalid credentials")
      } else {
        setToken(data["token"])
        navigate(next)
      }
    } catch (error) {
      alert("Something went wrong, please try again. If the problem persists, please contact support.")
      console.error("Login error:", error)
    }
  })
}
