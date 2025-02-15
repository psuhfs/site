// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Basic validation
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        try {
            // Here you would typically make an API call
            // For demonstration, we'll just pass some parameters
            navigateWithQueries('/dashboard', {
                email: email,
                name: fullName,
                signup_timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Signup error:', error);
            // Handle error appropriately
        }
    });


    const loginHref = document.getElementById('loginHref');
    loginHref.addEventListener('click', async (e) => {
        e.preventDefault();

        navigateWithQueries('/login');
    });
});