// Login form handler
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login script loaded');
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    
    function showMessage(text, type = 'success') {
        console.log('Showing message:', text, type);
        if (!messageDiv) {
            console.error('Message div not found');
            return;
        }
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
            messageDiv.style.display = 'none';
        }, 5000);
    }

    if (!loginForm) {
        console.error('Login form not found');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            console.log('Attempting login...');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log('Login response:', response.status);
            const data = await response.json();
            console.log('Login data:', data);
            
            if (response.ok && data.success) {
                showMessage('T', 'success');
                if (window.updateAuthLink) {
                    await window.updateAuthLink();
                }
                setTimeout(() => {
                    window.location.href = data.redirectUrl || '/admin';
                }, 1000);
            } else {
                showMessage(data.message || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('An error occurred. Please try again.', 'error');
        }
    });
    
    // Check if already logged in
    checkAuthStatus();
    
    // Check authentication status
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                window.location.href = '/admin';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            showMessage('Error checking authentication status. Please try again.', 'error');
        }
    }

    // Handle unauthorized access
    window.addEventListener('unhandledrejection', event => {
        if (event.reason?.response?.status === 401) {
            window.location.href = '/login.html';
        }
    });
});
