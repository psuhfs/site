// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm")

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const fullName = document.getElementById("fullName").value
        const email = document.getElementById("email").value
        const password = document.getElementById("password").value
        const confirmPassword = document.getElementById("confirmPassword").value

        // Basic validation
        if (password !== confirmPassword) {
            alert("Passwords do not match!")
            return
        }

        try {
            let next = getNext()
            if (!next) {
                // TODO: need to build dashboard
                next = "/dashboard"
            }

            const response = await apiCall("http://localhost:3002/auth/signup", JSON.stringify({
                fullName,
                email,
                password,
            }));

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
