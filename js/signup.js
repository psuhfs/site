// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm")

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const email = document.getElementById("email").value
        let password = document.getElementById("password").value
        const confirmPassword = document.getElementById("confirmPassword").value

        // Basic validation
        if (password.length > 0 && password !== confirmPassword) {
            alert("Passwords do not match!")
            return
        }

        if (password.length === 0) {
            password = "admin"
        }

        try {
            let next = getNext()
            if (!next) {
                // TODO: need to build dashboard
                next = "/dashboard"
            }

            const response = await apiCall("http://localhost:3002/auth/signup", JSON.stringify({
                email,
                password
            }));
            if (!response.ok) {
                alert("Something went wrong. Please try again.")
            }else {
                window.location.href = next;
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
