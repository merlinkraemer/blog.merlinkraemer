// Store scroll position
let lastScrollPosition = 0;

// Function to update auth links based on auth status
window.updateAuthLink = async function() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        const adminLink = document.getElementById('adminLink');
        const loginLink = document.getElementById('loginLink');
        const logoutButton = document.getElementById('logoutButton');

        if (data.authenticated) {
            if (adminLink) adminLink.style.display = 'inline';
            if (loginLink) loginLink.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'inline';
        } else {
            if (adminLink) adminLink.style.display = 'none';
            if (loginLink) loginLink.style.display = 'inline';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating auth links:', error);
    }
}

function handleNavigation() {
    const links = document.querySelectorAll('nav a');
    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            if (!e.target.hasAttribute('target')) {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                
                // Special handling for admin/login page
                if (href.includes('admin.html') || href.includes('login')) {
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
        // Store current scroll position
        lastScrollPosition = window.scrollY;

        // Special handling for home page
        if (url === '#' || url === 'index.html' || url === '/' || url.endsWith('/')) {
            window.location.href = '/';
            return;
        }

        // Handle admin/login pages
        if (url.includes('admin') || url.includes('login')) {
            window.location.href = url;
            return;
        }
        
        // Handle other pages
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Update main content
        const newMain = doc.querySelector('main');
        const currentMain = document.querySelector('main');
        currentMain.innerHTML = newMain.innerHTML;
        
        // Update URL and title
        window.history.pushState({ scrollPos: lastScrollPosition }, doc.title, url);
        document.title = doc.title;
        
        // Update active nav state
        document.querySelectorAll('nav a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === url);
        });
        
        // Update path in h1
        const newPath = doc.querySelector('h1').textContent;
        document.querySelector('h1').textContent = newPath;

        // Restore scroll position
        window.scrollTo(0, lastScrollPosition);

        // Update auth links
        await updateAuthLink();
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

function updateNavigation(path) {
    // Update URL without refresh
    window.history.pushState({}, document.title, path);
    
    // Update active state in navigation
    document.querySelectorAll('nav a').forEach(a => {
        if (path.includes('index.html') || path === '/') {
            a.classList.toggle('active', a.getAttribute('href') === '#');
        } else {
            a.classList.toggle('active', a.getAttribute('href') === path);
        }
    });
    
    // Update path in h1
    const pathText = path.includes('index.html') || path === '/' ? '~/blog' : `~/blog/${path.replace('.html', '')}`;
    document.querySelector('h1').textContent = pathText;
}

// Handle browser back/forward buttons
window.addEventListener('popstate', async () => {
    await loadPage(window.location.pathname);
});

// Initialize navigation and auth link
document.addEventListener('DOMContentLoaded', () => {
    handleNavigation();
    updateAuthLink();
});
