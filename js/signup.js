// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
    if (!document.cookie.includes("token")) {
        alert("You must be logged in to access this page.")
        navigateWithQueries("/login")
    }

    const signupForm = document.getElementById("signupForm")
    const email = document.getElementById("email")
    const username = document.getElementById("username")
    const password = document.getElementById("password")
    const confirmPassword = document.getElementById("confirmPassword")

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
        if (password.value !== "temp" && password.value !== confirmPassword) {
            alert("Passwords do not match!")
            return
        }

        try {
            let next = getNext()
            if (!next) {
                // TODO: need to build dashboard
                next = "/dashboard"
            }

            const response = await apiCallPost(
                `${BASE_URL}/auth/signup`,
                JSON.stringify({
                    username: username.value,
                    email: email.value,
                    password: password.value,
                }),
            )
            if (!response.ok) {
                alert("Something went wrong. Please try again.")
            } else {
                window.location.href = next
            }
        } catch (error) {
            console.error("Signup error:", error)
            // Handle error appropriately
        }
    })

    const loginHref = document.getElementById("loginHref")
    loginHref.addEventListener("click", async (e) => {
        e.preventDefault()
        navigateWithQueries("/login")
    })
})
