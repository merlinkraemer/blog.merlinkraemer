// Store selected images
let selectedImages = [];
let editingPostId = null;

// Function to format date in [YYYY-MM-DD] format
function formatDate(date) {
    const d = new Date(date);
    return `[${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}]`;
}

// Function to create image HTML
function createImageHTML(image, size = 'medium') {
    const maxWidth = size === 'small' ? '120px' : '100%';
    return `<img src="${image.path}" alt="${image.alt || ''}" style="max-width: ${maxWidth};">`;
}

// Function to create post HTML
function createPostHTML(post) {
    return `
        <article class="post" data-id="${post.id}">
            <div class="post-content">
                <div class="post-header">
                    <h2 class="post-title">${post.title}</h2>
                    <span class="post-date">${formatDate(post.date)}</span>
                </div>
                <div class="post-body">
                    <div class="post-text">${post.content}</div>
                </div>
                <div class="post-actions">
                    <button class="btn-edit" onclick="editPost('${post.id}')">Edit</button>
                    <button class="btn-delete" onclick="deletePost('${post.id}')">Delete</button>
                </div>
            </div>
            <form class="post-edit-form" onsubmit="updatePost(event, '${post.id}')">
                <input type="text" name="title" value="${post.title}" required>
                <textarea name="content" required>${post.content.replace(/<br>/g, '\n')}</textarea>
                <div class="edit-media">
                    <button type="button" onclick="toggleEditImages('${post.id}')">Edit Images</button>
                    <div class="media-grid edit-media-grid" data-post-id="${post.id}">
                        <!-- Images will be loaded here -->
                    </div>
                    ${post.media && post.media.length > 0 ? `
                        <div class="current-images">
                            <h4>Current Images:</h4>
                            <div class="current-images-grid">
                                ${post.media.map(m => `
                                    <div class="current-image">
                                        ${createImageHTML(m, 'small')}
                                        <span>${m.path.split('/').pop()}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="btn-group">
                    <button type="submit">Save</button>
                    <button type="button" onclick="cancelEdit('${post.id}')">Cancel</button>
                </div>
            </form>
        </article>
    `;
}

// Function to load available images
async function loadImages() {
    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        
        if (data.success && data.images) {
            const mediaGrid = document.getElementById('mediaGrid');
            mediaGrid.innerHTML = data.images.map(image => `
                <div class="media-item" data-path="${image.path}">
                    <img src="${image.url}" alt="${image.name}">
                    <input type="checkbox" name="images[]" value="${image.path}">
                </div>
            `).join('');

            // Add click event listeners to media items
            mediaGrid.querySelectorAll('.media-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        item.classList.toggle('selected', checkbox.checked);
                        
                        selectedImages = Array.from(mediaGrid.querySelectorAll('input[type="checkbox"]:checked'))
                            .map(cb => cb.value);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading images:', error);
        showMessage('Error loading images. Please refresh the page.', 'error');
    }
}

// Function to load posts
async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        
        if (data.success && data.posts) {
            const postsContainer = document.getElementById('posts');
            postsContainer.innerHTML = data.posts.map(createPostHTML).join('');
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        showMessage('Error loading posts. Please refresh the page.', 'error');
    }
}

// Function to show messages
function showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.className = type;
    messageDiv.textContent = text;
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 5000);
}

// Toggle image grid for new post
document.getElementById('toggleImages').addEventListener('click', () => {
    const mediaGrid = document.getElementById('mediaGrid');
    mediaGrid.classList.toggle('show');
});

// Toggle image grid for editing
function toggleEditImages(postId) {
    const post = document.querySelector(`.post[data-id="${postId}"]`);
    const mediaGrid = post.querySelector('.edit-media-grid');
    mediaGrid.classList.toggle('show');
    
    if (mediaGrid.classList.contains('show') && !mediaGrid.querySelector('.media-item')) {
        loadEditImages(mediaGrid, postId);
    }
}

// Load images for editing
async function loadEditImages(container, postId) {
    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        
        if (data.success && data.images) {
            // Get current post's images
            const post = document.querySelector(`.post[data-id="${postId}"]`);
            const currentImages = Array.from(post.querySelectorAll('.current-image img'))
                .map(img => img.getAttribute('src'));

            container.innerHTML = data.images.map(image => `
                <div class="media-item" data-path="${image.path}">
                    <img src="${image.url}" alt="${image.name}">
                    <input type="checkbox" name="edit_images[]" value="${image.path}"
                        ${currentImages.includes(image.path) ? 'checked' : ''}>
                </div>
            `).join('');

            // Add click event listeners and set initial selected state
            container.querySelectorAll('.media-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                item.classList.toggle('selected', checkbox.checked);
                
                item.addEventListener('click', (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        item.classList.toggle('selected', checkbox.checked);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading images:', error);
        showMessage('Error loading images for editing. Please try again.', 'error');
    }
}

// Handle new post submission
document.getElementById('submitPost').addEventListener('click', async () => {
    const titleInput = document.getElementById('newTitle');
    const contentInput = document.getElementById('newContent');
    
    try {
        const postData = {
            title: titleInput.value,
            content: contentInput.value,
            images: selectedImages
        };

        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Post created successfully!');
            
            // Clear form
            titleInput.value = '';
            contentInput.value = '';
            selectedImages = [];
            document.querySelectorAll('.media-item').forEach(item => {
                item.classList.remove('selected');
                item.querySelector('input[type="checkbox"]').checked = false;
            });
            document.getElementById('mediaGrid').classList.remove('show');
            
            // Reload posts
            loadPosts();
        } else {
            throw new Error(data.message || 'Failed to create post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showMessage(error.message || 'Error creating post. Please try again.', 'error');
    }
});

// Edit post
function editPost(id) {
    const post = document.querySelector(`.post[data-id="${id}"]`);
    post.classList.add('editing');
    post.querySelector('.post-edit-form').classList.add('show');
    editingPostId = id;
}

// Cancel edit
function cancelEdit(id) {
    const post = document.querySelector(`.post[data-id="${id}"]`);
    post.classList.remove('editing');
    post.querySelector('.post-edit-form').classList.remove('show');
    editingPostId = null;
}

// Update post
async function updatePost(event, id) {
    event.preventDefault();
    const form = event.target;
    const post = document.querySelector(`.post[data-id="${id}"]`);
    
    try {
        // Get selected images
        const selectedEditImages = Array.from(post.querySelectorAll('.edit-media-grid input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        const response = await fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: form.title.value,
                content: form.content.value,
                images: selectedEditImages
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Post updated successfully!');
            cancelEdit(id);
            loadPosts();
        } else {
            throw new Error(data.message || 'Failed to update post');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showMessage(error.message || 'Error updating post. Please try again.', 'error');
    }
}

// Delete post
async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    try {
        const response = await fetch(`/api/posts/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Post deleted successfully!');
            loadPosts();
        } else {
            throw new Error(data.message || 'Failed to delete post');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showMessage(error.message || 'Error deleting post. Please try again.', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadImages();
    loadPosts();
});
