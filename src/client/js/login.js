// Login form handler with performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        form: document.getElementById('loginForm'),
        message: document.getElementById('message'),
        username: document.getElementById('username'),
        password: document.getElementById('password')
    };
    
    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Optimized message display
    const messageQueue = [];
    let isShowingMessage = false;
    
    function showMessage(text, type = 'success') {
        if (!elements.message) return;
        
        messageQueue.push({ text, type });
        if (!isShowingMessage) {
            processMessageQueue();
        }
    }
    
    async function processMessageQueue() {
        if (messageQueue.length === 0) {
            isShowingMessage = false;
            return;
        }
        
        isShowingMessage = true;
        const { text, type } = messageQueue.shift();
        
        elements.message.textContent = text;
        elements.message.className = `message ${type}`;
        elements.message.style.display = 'block';
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        elements.message.textContent = '';
        elements.message.className = '';
        elements.message.style.display = 'none';
        
        // Process next message if any
        processMessageQueue();
    }

    if (!elements.form) return;

    // Optimized form submission
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            username: elements.username.value,
            password: elements.password.value
        };
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showMessage('Login successful! Redirecting...', 'success');
                // Use the cached version from navigation.js
                if (window.updateAuthLink) {
                    window.updateAuthLink();
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
    
    // Optimized auth status check with cache
    const checkAuthStatus = async () => {
        try {
            // Use the cached version if available
            if (window.cache?.auth?.status) {
                if (window.cache.auth.status) {
                    window.location.href = '/admin';
                }
                return;
            }
            
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                window.location.href = '/admin';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            showMessage('Error checking authentication status.', 'error');
        }
    };
    
    // Debounced auth check
    const debouncedAuthCheck = debounce(checkAuthStatus, 250);
    debouncedAuthCheck();

    // Optimized error handling
    window.addEventListener('unhandledrejection', event => {
        if (event.reason?.response?.status === 401) {
            // Debounce redirect to prevent multiple redirects
            debouncedAuthCheck();
        }
    });
});
