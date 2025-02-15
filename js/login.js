// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm")

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const username = document.getElementById("username").value
        const password = document.getElementById("password").value

        try {
            let next = getNext()
            if (!next) {
                // TODO: need to build dashboard
                next = "/dashboard"
            }
            const response = await apiCall("http://localhost:3002/auth/signin", JSON.stringify({
                username,
                password,
            }));

            const data = await response.json()
            if (!response.ok) {
                alert("Invalid credentials")
            } else {
                setToken(data["token"]);
                window.location.href = next;
            }
        } catch (error) {
            alert("Something went wrong, please try again. If the problem persists, please contact support.");
            console.error("Login error:", error)
        }
    })

    const loginHref = document.getElementById("signupHref")
    loginHref.addEventListener("click", async (e) => {
        e.preventDefault()

        navigateWithQueries("/signup")
    })
})
