// Cache for auth status and page content
const cache = {
    auth: {
        status: null,
        timestamp: 0
    },
    pages: new Map(),
    AUTH_TTL: 300000 // 5 minutes cache for auth status
};

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to update auth links based on auth status
window.updateAuthLink = async function() {
    const now = Date.now();
    
    // Use cached auth status if valid
    if (cache.auth.status !== null && (now - cache.auth.timestamp) < cache.AUTH_TTL) {
        updateAuthUI(cache.auth.status);
        return;
    }

    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        // Update cache
        cache.auth.status = data.authenticated;
        cache.auth.timestamp = now;
        
        updateAuthUI(data.authenticated);
    } catch (error) {
        console.error('Error updating auth links:', error);
    }
}

// Separate UI update function
function updateAuthUI(authenticated) {
    const elements = {
        adminLink: document.getElementById('adminLink'),
        loginLink: document.getElementById('loginLink'),
        logoutButton: document.getElementById('logoutButton')
    };

    Object.entries(elements).forEach(([key, element]) => {
        if (!element) return;
        
        const shouldShow = (
            (key === 'adminLink' && authenticated) ||
            (key === 'logoutButton' && authenticated) ||
            (key === 'loginLink' && !authenticated)
        );
        
        element.style.display = shouldShow ? 'inline' : 'none';
    });
}

function handleNavigation() {
    const links = document.querySelectorAll('nav a');
    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            if (!e.target.hasAttribute('target')) {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                
                // Special handling for admin/login page
                if (href.includes('admin')) {
                    const response = await fetch('/api/auth/status');
                    const data = await response.json();
                    if (!data.authenticated) {
                        window.location.href = '/login.html';
                        return;
                    }
                    window.location.href = href;
                    return;
                }
                if (href.includes('login')) {
                    const response = await fetch('/api/auth/status');
                    const data = await response.json();
                    if (data.authenticated) {
                        window.location.href = '/admin';
                        return;
                    }
                    window.location.href = href;
                    return;
                }
                
                // Special handling for home page
                if (href === '#' || href === 'index.html' || href === '/') {
                    window.location.href = 'index.html';
                    return;
                }
                
                // Handle other pages normally
                await loadPage(href);
            }
        });
    });
}

async function loadPage(url) {
    try {
        // Special handling for home page and admin/login
        if (url === '#' || url === 'index.html' || url === '/' || url.endsWith('/')) {
            window.location.href = '/';
            return;
        }
        if (url.includes('admin') || url.includes('login')) {
            window.location.href = url;
            return;
        }

        // Check cache first
        if (cache.pages.has(url)) {
            updatePageContent(cache.pages.get(url));
            return;
        }
        
        // Fetch and parse page
        const response = await fetch(url);
        const html = await response.text();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Cache the parsed content
        const pageContent = {
            main: doc.querySelector('main').innerHTML,
            title: doc.title,
            path: doc.querySelector('h1').textContent
        };
        cache.pages.set(url, pageContent);
        
        // Update the page
        updatePageContent(pageContent);
        
        // Update URL
        window.history.pushState({}, doc.title, url);
        
        // Update navigation state
        updateNavState(url);
        
        // Debounced auth update
        debouncedAuthUpdate();
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

// Efficient page content update
function updatePageContent(content) {
    const currentMain = document.querySelector('main');
    if (!currentMain) return;
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    const temp = document.createElement('div');
    temp.innerHTML = content.main;
    while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
    }
    
    currentMain.innerHTML = '';
    currentMain.appendChild(fragment);
    
    document.title = content.title;
    const h1 = document.querySelector('h1');
    if (h1) h1.textContent = content.path;
}

// Update navigation state
function updateNavState(path) {
    const links = document.querySelectorAll('nav a');
    const isHome = path.includes('index.html') || path === '/';
    
    links.forEach(a => {
        const href = a.getAttribute('href');
        a.classList.toggle('active', 
            isHome ? href === '#' : href === path
        );
    });
}

// Create debounced version of updateAuthLink
const debouncedAuthUpdate = debounce(window.updateAuthLink, 250);

// Handle browser back/forward buttons
window.addEventListener('popstate', async () => {
    await loadPage(window.location.pathname);
});

// Initialize navigation and auth link
document.addEventListener('DOMContentLoaded', () => {
    handleNavigation();
    window.updateAuthLink();
    
    // Clear page cache on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            cache.pages.clear();
            window.updateAuthLink();
        }
    });
});

// Create parser instance once
const parser = new DOMParser();
