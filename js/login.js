// Handle form submission
document.addEventListener("DOMContentLoaded", async () => {
    // WARN: DO NOT ADD ANY CODE ABOVE submitHandler() CALL.
    // explanation: upon submitting form, the redirection might add email and password publicly, in queries,
    // so we must wait for submitHandler to initiate before we add ANY code.
    submitHandler();

    const loginHref = document.getElementById("signupHref")
    loginHref.addEventListener("click", async (e) => {
        e.preventDefault()

        navigateWithQueries("/signup")
    });
    let next = getNext();
    if (!next) {
        // TODO: need to build dashboard
        next = "/dashboard"
    }

    if ((await apiCallGet("http://localhost:3002/auth/authenticated")).ok) {
        window.location.href = next;
    }
});

function submitHandler() {
    let next = getNext();
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
            const response = await apiCallPost("http://localhost:3002/auth/signin", JSON.stringify({
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
    });
}
