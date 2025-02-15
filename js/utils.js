const BASE_URL = "http://localhost:3000"

// Function to preserve and transfer query parameters
function navigateWithQueries(path, newParams = {}) {
    if (path === window.location.href) {
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
    if (path === window.location.href) {
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
        },
        credentials: "include",
    })
}

function setToken(token) {
    document.cookie = `token=${token}; Path=/`
}

function getToken() {
    return document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
}
