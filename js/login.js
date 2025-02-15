// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Here you would typically make an API call
            // For demonstration, we'll just pass the email as a query parameter
            navigateWithQueries('/dashboard', { 
                email: email,
                // Add any other parameters you want to preserve or add
                login_timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Login error:', error);
            // Handle error appropriately
        }
    });

    const loginHref = document.getElementById('signupHref');
    loginHref.addEventListener('click', async (e) => {
        e.preventDefault();

        navigateWithQueries('/signup');
    });
});