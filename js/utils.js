// Function to preserve and transfer query parameters
function navigateWithQueries(path, newParams = {}) {
    // Get current URL parameters
    const currentParams = new URLSearchParams(window.location.search);
    
    // Add new parameters while preserving existing ones
    Object.entries(newParams).forEach(([key, value]) => {
        currentParams.set(key, value);
    });

    // Create the new URL with all parameters
    const queryString = currentParams.toString();
    const newUrl = path + (queryString ? `?${queryString}` : '');
    
    // Navigate to the new URL
    window.location.href = newUrl;
}