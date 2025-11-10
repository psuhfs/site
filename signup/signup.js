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

  // Handle access levels
  handleAccessLevels(
    await (await apiCallGet(`${BASE_URL}/zones/getZones`)).json(),
    await (await apiCallGet(`${BASE_URL}/zones/getStockAccess`)).json(),
  )

  if (!document.cookie.includes("token")) {
    alert("You must be logged in to access this page.")
    navigateWithQueries("/login")
  }

  const signupForm = document.getElementById("signupForm")
  const email = document.getElementById("email")
  const username = document.getElementById("username")
  const password = document.getElementById("password")
  const confirmPassword = document.getElementById("confirmPassword")
  const zoneAccessCheckboxes = document.querySelectorAll(".zone-access")
  const stockOnAccessCheckboxes = document.querySelectorAll(".stock-on-access")

  password.value = confirmPassword.value = "temp"
  let emailManuallyEdited = false
  email.addEventListener("input", () => {
    emailManuallyEdited = true
  })

  // Add listener to username input to update email
  username.addEventListener("input", (e) => {
    if (!emailManuallyEdited) {
      const username = e.target.value
      email.value = username ? `${username}@psu.edu` : ""
    }
  })

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Basic validation
    if (password.value !== "temp" && password.value !== confirmPassword.value) {
      alert("Passwords do not match!")
      return
    }

    try {
      const zonalAccess = getSelectedValues(zoneAccessCheckboxes)
      const stockonAccess = getSelectedValues(stockOnAccessCheckboxes)

      const response = await apiCallPost(
        `${BASE_URL}/auth/signup`,
        JSON.stringify({
          username: username.value,
          email: email.value,
          password: password.value,
          zonalAccess,
          stockonAccess,
        }),
      )
      if (!response.ok) {
        alert("Something went wrong. Please try again.")
      } else {
        showSuccessModal()
      }
    } catch (error) {
      console.error("Signup error:", error)
      // Handle error appropriately
    }
  })
})

function getSelectedValues(checkboxes) {
  return Array.from(checkboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value)
}

function handleAccessLevels(zoneList, stockOnList) {
  let zoneAccess = document.getElementById("zoneAccess")
  let stockOnAccess = document.getElementById("stockOnAccess")
  for (let i = 0; i < zoneList.length; i++) {
    let label = document.createElement("label")
    let input = document.createElement("input")
    input.type = "checkbox"
    input.className = "zone-access"
    input.value = zoneList[i]
    label.appendChild(input)
    label.innerHTML = `${label.innerHTML} ${zoneList[i]}`
    zoneAccess.appendChild(label)
  }

  for (let i = 0; i < stockOnList.length; i++) {
    let label = document.createElement("label")
    let input = document.createElement("input")
    input.type = "checkbox"
    input.className = "stock-on-access"
    input.value = stockOnList[i]
    label.appendChild(input)
    label.innerHTML = `${label.innerHTML} ${stockOnList[i]}`

    stockOnAccess.appendChild(label)
  }
}



function showSuccessModal() {
  const modal = document.getElementById("successModal")
  const closeModalBtn = document.getElementById("closeModalBtn")
  const createAnotherBtn = document.getElementById("createAnotherBtn")
  
  modal.style.display = "flex"
  
  // Close modal and stay on page
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none"
  })
  
  // Create another account - reset form
  createAnotherBtn.addEventListener("click", () => {
    modal.style.display = "none"
    resetForm()
  })
  
  // Close on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none"
    }
  })
  
  // Close on overlay click
  const overlay = modal.querySelector(".modal-overlay")
  overlay.addEventListener("click", () => {
    modal.style.display = "none"
  })
}

function resetForm() {
  const signupForm = document.getElementById("signupForm")
  const email = document.getElementById("email")
  const username = document.getElementById("username")
  const password = document.getElementById("password")
  const confirmPassword = document.getElementById("confirmPassword")
  const zoneAccessCheckboxes = document.querySelectorAll(".zone-access")
  const stockOnAccessCheckboxes = document.querySelectorAll(".stock-on-access")
  
  // Reset form
  signupForm.reset()
  
  // Reset password fields to "temp"
  password.value = confirmPassword.value = "temp"
  
  // Clear email
  email.value = ""
  
  // Uncheck all checkboxes
  zoneAccessCheckboxes.forEach(checkbox => checkbox.checked = false)
  stockOnAccessCheckboxes.forEach(checkbox => checkbox.checked = false)
  
  // Clear selected items display
  document.getElementById("selectedZoneAccess").innerHTML = ""
  document.getElementById("selectedStockOnAccess").innerHTML = ""
  
  // Focus on username field
  username.focus()
}