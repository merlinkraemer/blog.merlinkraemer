// Function to format date in [YYYY-MM-DD] format
function formatDate(date) {
    const d = new Date(date);
    return `[${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}]`;
}

// Function to create HTML for a single post
function createPostHTML(post) {
    const mediaHTML = post.media ? post.media.map(m => {
        if (m.type === 'image') {
            return `<img src="${m.path}" alt="${m.alt || ''}" loading="lazy">`;
        } else if (m.type === 'gif') {
            return `<img src="${m.path}" alt="${m.alt || ''}" loading="lazy">`;
        }
        return '';
    }).join('') : '';

    return `
        <article class="post">
            <div class="post-header">
                <h2 class="post-title">${post.title}</h2>
                <span class="post-date">${formatDate(post.date)}</span>
            </div>
            <div class="post-content">
                ${post.content}
                ${mediaHTML}
            </div>
        </article>
    `;
}

// Function to load and display posts
async function loadPosts() {
    try {
        const response = await fetch('posts.json');
        const data = await response.json();
        const postsContainer = document.getElementById('posts');
        
        // Sort posts by date (newest first)
        const sortedPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Create HTML for all posts
        const postsHTML = sortedPosts.map(createPostHTML).join('');
        postsContainer.innerHTML = postsHTML;
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('posts').innerHTML = '<p class="error">Error loading posts. Please try again later.</p>';
    }
}

// Load posts when the page loads
document.addEventListener('DOMContentLoaded', loadPosts);
