// Check authentication on load
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Store selected images
let selectedImages = [];
let editingPostId = null;
let cachedImages = null;
let imageEventListeners = new WeakMap();

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
                    ${post.media && post.media.length > 0 ? `
                        <div class="post-media">
                            ${post.media.map(m => createImageHTML(m)).join('')}
                        </div>
                    ` : ''}
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

// Function to add image click handlers
function addImageClickHandlers(container) {
    container.querySelectorAll('.media-item').forEach(item => {
        // Skip if already has event listener
        if (imageEventListeners.has(item)) return;

        const handler = (e) => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                item.classList.toggle('selected', checkbox.checked);
                
                selectedImages = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(cb => cb.value);
            }
        };

        item.addEventListener('click', handler);
        imageEventListeners.set(item, handler);
    });
}

// Function to load available images
async function loadImages() {
    if (cachedImages) {
        const mediaGrid = document.getElementById('mediaGrid');
        mediaGrid.innerHTML = cachedImages;
        addImageClickHandlers(mediaGrid);
        return;
    }

    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        
        if (data.success && data.images) {
            const html = data.images.map(image => `
                <div class="media-item" data-path="${image.path}">
                    <img src="${image.url}" alt="${image.name}">
                    <input type="checkbox" name="images[]" value="${image.path}">
                </div>
            `).join('');

            cachedImages = html;
            const mediaGrid = document.getElementById('mediaGrid');
            mediaGrid.innerHTML = html;
            addImageClickHandlers(mediaGrid);
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

// Modal management
let modalEventListenersInitialized = false;

function initializeModalEventListeners() {
    if (modalEventListenersInitialized) return;

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
    
    // Close on X button click
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    // Handle image selection confirmation
    const insertBtn = document.getElementById('insertSelectedImages');
    if (insertBtn) {
        insertBtn.onclick = () => {
            const modal = document.getElementById('imageSelectModal');
            const selectedPaths = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            selectedImages = selectedPaths;
            
            // Update preview
            const previewDiv = document.getElementById('createPostMedia');
            if (previewDiv) {
                previewDiv.innerHTML = selectedPaths.map(path => `
                    <div class="preview-image">
                        <img src="${path}" alt="Selected image">
                    </div>
                `).join('');
            }
            
            closeModal('imageSelectModal');
        };
    }

    modalEventListenersInitialized = true;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'none';
}

// Handle file upload
document.getElementById('manageMediaBtn').addEventListener('click', () => {
    openModal('mediaUploadModal');
});

// Handle file upload form
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('mediaFile');
        const files = fileInput.files;
        
        if (files.length === 0) {
            showMessage('Please select files to upload', 'error');
            return;
        }
        
        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.files) {
                showMessage('Files uploaded successfully!', 'success');
                closeModal('mediaUploadModal');
                cachedImages = null; // Clear cache to force reload
                await loadImages(); // Reload images grid
                fileInput.value = ''; // Clear input
            }
        } catch (error) {
            console.error('Upload error:', error);
            showMessage('Error uploading files. Please try again.', 'error');
        }
    });
}

// Preview uploaded files
document.getElementById('mediaFile')?.addEventListener('change', (e) => {
    const preview = document.getElementById('uploadPreview');
    preview.innerHTML = '';
    
    for (let file of e.target.files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML += `
                    <div class="preview-image">
                        <img src="${e.target.result}" alt="Upload preview">
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    }
});

// Toggle image grid for new post
document.getElementById('toggleImages').addEventListener('click', async () => {
    openModal('imageSelectModal');
    await loadImages();
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
        if (!cachedImages) {
            await loadImages();
        }

        // Get current post's images
        const post = document.querySelector(`.post[data-id="${postId}"]`);
        const currentImages = Array.from(post.querySelectorAll('.current-image img'))
            .map(img => img.getAttribute('src'));

        container.innerHTML = cachedImages;
        
        // Update checkboxes for current images
        container.querySelectorAll('.media-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const isSelected = currentImages.includes(item.dataset.path);
            checkbox.checked = isSelected;
            item.classList.toggle('selected', isSelected);
        });

        addImageClickHandlers(container);
    } catch (error) {
        console.error('Error loading images:', error);
        showMessage('Error loading images for editing. Please try again.', 'error');
    }
}

// Handle new post submission
document.getElementById('submitPost').addEventListener('click', async () => {
    const titleInput = document.getElementById('newTitle');
    const contentInput = document.getElementById('newContent');
    
    if (!titleInput.value.trim() || !contentInput.value.trim()) {
        showMessage('Please fill in both title and content', 'error');
        return;
    }
    
    try {
        const content = contentInput.value.replace(/\n/g, '<br>'); // Convert newlines to <br>
        const postData = {
            title: titleInput.value.trim(),
            content: content,
            images: selectedImages
        };

        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }

        const data = await response.json();
        showMessage('Post created successfully!');
        
        // Clear form
        titleInput.value = '';
        contentInput.value = '';
        selectedImages = [];
        document.querySelectorAll('.media-item').forEach(item => {
            item.classList.remove('selected');
            item.querySelector('input[type="checkbox"]').checked = false;
        });
        closeModal('imageSelectModal');
        
        // Reload posts
        await loadPosts();
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
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth()) {
        initializeModalEventListeners();
        await loadImages();
        await loadPosts();
    }
});

// Handle logout
document.getElementById('logoutButton').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Error logging out. Please try again.', 'error');
    }
});

// Handle unauthorized responses
window.addEventListener('unhandledrejection', event => {
    if (event.reason?.response?.status === 401) {
        window.location.href = '/login.html';
    }
});
