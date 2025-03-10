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

// Performance optimized state management
const state = {
    selectedImages: [],
    editingPostId: null,
    cachedImages: null,
    imageEventListeners: new WeakMap(),
    imageObserver: null,
    modalState: {
        initialized: false,
        activeModal: null
    }
};

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

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

// Optimized image click handler
function addImageClickHandlers(container) {
    // Remove existing handler if any
    const existingHandler = container._clickHandler;
    if (existingHandler) {
        container.removeEventListener('click', existingHandler);
    }

    // Create new delegated click handler
    const clickHandler = (e) => {
        const item = e.target.closest('.media-item');
        if (!item) return;

        const checkbox = item.querySelector('input[type="checkbox"]');
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            item.classList.toggle('selected', checkbox.checked);
            
            // Use container-level query for better performance
            state.selectedImages = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
        }
    };

    container.addEventListener('click', clickHandler);
    container._clickHandler = clickHandler;

    // Setup lazy loading for images
    if (!state.imageObserver) {
        state.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        state.imageObserver.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '50px' });
    }

    // Observe all images in container
    container.querySelectorAll('img[data-src]').forEach(img => {
        state.imageObserver.observe(img);
    });
}

// Function to load available images with error handling
async function loadImages() {
    const mediaGrid = document.getElementById('mediaGrid');
    if (!mediaGrid) return;

    try {
        showMessage('Loading images...', 'info');
        const response = await fetch('/api/images');
        const data = await response.json();
        
        if (data.success && data.images) {
            const fragment = document.createDocumentFragment();
            data.images.forEach(image => {
                const div = document.createElement('div');
                div.className = 'media-item';
                div.dataset.path = image.path;
                div.innerHTML = `
                    <img src="${image.url}" alt="${image.name}">
                    <input type="checkbox" name="images[]" value="${image.path}">
                `;
                fragment.appendChild(div);
            });

            mediaGrid.innerHTML = '';
            mediaGrid.appendChild(fragment);
            addImageClickHandlers(mediaGrid);
        } else {
            throw new Error('No images found');
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

// Optimized modal management
function initializeModalEventListeners() {
    if (state.modalState.initialized) return;

    // Use event delegation for modal interactions
    document.body.addEventListener('click', (e) => {
        // Close on overlay click
        if (e.target.matches('.modal-overlay')) {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        }
        
        // Close on X button click
        if (e.target.matches('.close-modal')) {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        }
    });

    // Handle image selection confirmation
    const insertBtn = document.getElementById('insertSelectedImages');
    if (insertBtn) {
        insertBtn.onclick = () => {
            const modal = document.getElementById('imageSelectModal');
            if (!modal) return;

            const selectedPaths = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            state.selectedImages = selectedPaths;
            
            // Update preview using DocumentFragment
            const previewDiv = document.getElementById('createPostMedia');
            if (previewDiv) {
                const fragment = document.createDocumentFragment();
                selectedPaths.forEach(path => {
                    const div = document.createElement('div');
                    div.className = 'preview-image';
                    div.innerHTML = `<img src="${path}" alt="Selected image">`;
                    fragment.appendChild(div);
                });
                previewDiv.innerHTML = '';
                previewDiv.appendChild(fragment);
            }
            
            closeModal('imageSelectModal');
        };
    }

    state.modalState.initialized = true;
}

// Optimized modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || state.modalState.activeModal === modalId) return;
    
    // Close any open modal first
    if (state.modalState.activeModal) {
        closeModal(state.modalState.activeModal);
    }
    
    modal.style.display = 'block';
    state.modalState.activeModal = modalId;
    
    // Ensure modal event listeners are initialized
    if (!state.modalState.initialized) {
        initializeModalEventListeners();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'none';
    if (state.modalState.activeModal === modalId) {
        state.modalState.activeModal = null;
    }
}

// Handle file upload
document.getElementById('manageMediaBtn').addEventListener('click', () => {
    openModal('mediaUploadModal');
});

// Optimized file upload handling
function initializeFileUpload() {
    const uploadForm = document.getElementById('uploadForm');
    if (!uploadForm) return;

    const fileInput = document.getElementById('mediaFile');
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const files = fileInput.files;
        if (files.length === 0) {
            showMessage('Please select files to upload', 'error');
            return;
        }
        
        // Validate files
        const validFiles = Array.from(files).filter(file => {
            if (file.size > maxFileSize) {
                showMessage(`File ${file.name} is too large (max 5MB)`, 'error');
                return false;
            }
            if (!file.type.startsWith('image/')) {
                showMessage(`File ${file.name} is not an image`, 'error');
                return false;
            }
            return true;
        });
        
        if (validFiles.length === 0) return;
        
        const formData = new FormData();
        validFiles.forEach(file => formData.append('files', file));
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.files) {
                showMessage('Files uploaded successfully!', 'success');
                closeModal('mediaUploadModal');
                state.cachedImages = null; // Clear cache to force reload
                await loadImages(); // Reload images grid
                fileInput.value = ''; // Clear input
                
                // Clear preview
                const preview = document.getElementById('uploadPreview');
                if (preview) preview.innerHTML = '';
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

// Toggle image grid for new post with error handling
document.getElementById('toggleImages')?.addEventListener('click', async () => {
    try {
        openModal('imageSelectModal');
        await loadImages();
        
        // Ensure modal is properly initialized
        if (!state.modalState.initialized) {
            initializeModalEventListeners();
        }
    } catch (error) {
        console.error('Error loading images:', error);
        showMessage('Error loading images. Please try again.', 'error');
    }
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

// Load images for editing with state management
async function loadEditImages(container, postId) {
    try {
        if (!state.cachedImages) {
            await loadImages();
        }

        // Get current post's images
        const post = document.querySelector(`.post[data-id="${postId}"]`);
        if (!post) return;

        const currentImages = Array.from(post.querySelectorAll('.current-image img'))
            .map(img => img.getAttribute('src'));

        container.innerHTML = state.cachedImages;
        
        // Update checkboxes for current images
        container.querySelectorAll('.media-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (!checkbox) return;
            
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
            images: state.selectedImages
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
        
        // Clear form and state
        titleInput.value = '';
        contentInput.value = '';
        state.selectedImages = [];
        
        // Clear media grid selections
        const mediaGrid = document.getElementById('mediaGrid');
        if (mediaGrid) {
            mediaGrid.querySelectorAll('.media-item').forEach(item => {
                item.classList.remove('selected');
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = false;
            });
        }
        
        // Clear preview
        const previewDiv = document.getElementById('createPostMedia');
        if (previewDiv) previewDiv.innerHTML = '';
        closeModal('imageSelectModal');
        
        // Reload posts
        await loadPosts();
    } catch (error) {
        console.error('Error creating post:', error);
        showMessage(error.message || 'Error creating post. Please try again.', 'error');
    }
});

// Edit post with state management
function editPost(id) {
    const post = document.querySelector(`.post[data-id="${id}"]`);
    if (!post) return;
    
    post.classList.add('editing');
    const form = post.querySelector('.post-edit-form');
    if (form) form.classList.add('show');
    state.editingPostId = id;
}

// Cancel edit with state management
function cancelEdit(id) {
    const post = document.querySelector(`.post[data-id="${id}"]`);
    if (!post) return;
    
    post.classList.remove('editing');
    const form = post.querySelector('.post-edit-form');
    if (form) form.classList.remove('show');
    state.editingPostId = null;
    state.selectedImages = [];
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

// Auto-resize textarea
function initializeTextareaResize() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        const resize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
        
        textarea.addEventListener('input', resize);
        textarea.addEventListener('focus', resize);
        
        // Initial resize
        resize();
    });
}

// Optimized initialization
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth()) {
        initializeModalEventListeners();
        initializeFileUpload();
        initializeTextareaResize();
        
        // Load data in parallel
        await Promise.all([
            loadImages(),
            loadPosts()
        ]);
        
        // Setup scroll performance optimization
        const debouncedScroll = debounce(() => {
            if (state.imageObserver) {
                document.querySelectorAll('img[data-src]').forEach(img => {
                    state.imageObserver.observe(img);
                });
            }
        }, 100);
        
        window.addEventListener('scroll', debouncedScroll, { passive: true });
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
