// Store selected images
let selectedImages = [];
let editingPostId = null;

// Check authentication before allowing access
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is authenticated
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        window.location.href = '/login.html';
        return;
    }
    
    // Initialize admin functionality
    loadImages();
    loadPosts();
    initializeModals();
    initializeTextarea();
    
    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await logout();
        });
    }

    // Initialize post creation
    initializePostCreation();
});

// Initialize modals
function initializeModals() {
    // Media Upload Modal
    const manageMediaBtn = document.getElementById('manageMediaBtn');
    const mediaUploadModal = document.getElementById('mediaUploadModal');
    const uploadForm = document.getElementById('uploadForm');

    manageMediaBtn.addEventListener('click', () => {
        mediaUploadModal.classList.add('show');
    });

    // Image Selection Modal
    const toggleImagesBtn = document.getElementById('toggleImages');
    const imageSelectModal = document.getElementById('imageSelectModal');
    const insertSelectedBtn = document.getElementById('insertSelectedImages');

    toggleImagesBtn.addEventListener('click', () => {
        imageSelectModal.classList.add('show');
        loadImages(); // Refresh images when modal opens
    });

    // Close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').classList.remove('show');
        });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            overlay.closest('.modal').classList.remove('show');
        });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });

    // Handle file upload
    if (uploadForm) {
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadProgress = document.getElementById('uploadProgress');
        const mediaFile = document.getElementById('mediaFile');

        mediaFile.addEventListener('change', () => {
            uploadPreview.innerHTML = '';
            Array.from(mediaFile.files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        uploadPreview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });

        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            Array.from(mediaFile.files).forEach(file => {
                formData.append('files', file);
            });

            try {
                uploadProgress.textContent = 'Uploading...';
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                const data = await response.json();
                
                if (data.success) {
                    uploadProgress.textContent = 'Upload successful!';
                    uploadForm.reset();
                    uploadPreview.innerHTML = '';
                    loadImages(); // Refresh media grid
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Upload error:', error);
                uploadProgress.textContent = `Upload failed: ${error.message}`;
            }
        });
    }
}

// Initialize dynamic textarea
function initializeTextarea() {
    const textarea = document.getElementById('newContent');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
}

// Initialize post creation functionality
function initializePostCreation() {
    const submitButton = document.getElementById('submitPost');
    const imageSelectModal = document.getElementById('imageSelectModal');
    const insertSelectedBtn = document.getElementById('insertSelectedImages');

    if (submitButton) {
        submitButton.addEventListener('click', async () => {
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
                    body: JSON.stringify(postData),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    showMessage('Post created successfully!');
                    
                    // Clear form
                    titleInput.value = '';
                    contentInput.value = '';
                    selectedImages = [];
                    contentInput.style.height = '100px'; // Reset textarea height
                    
                    // Reset media grid
                    const mediaGrid = document.getElementById('mediaGrid');
                    mediaGrid.querySelectorAll('.media-item').forEach(item => {
                        item.classList.remove('selected');
                        const checkbox = item.querySelector('input[type="checkbox"]');
                        if (checkbox) checkbox.checked = false;
                    });
                    imageSelectModal.classList.remove('show');
                    
                    // Reload posts
                    await loadPosts();
                } else {
                    throw new Error(data.message || 'Failed to create post');
                }
            } catch (error) {
                console.error('Error creating post:', error);
                showMessage(error.message || 'Error creating post. Please try again.', 'error');
            }
        });
    }

    // Handle image selection
    if (insertSelectedBtn) {
        insertSelectedBtn.addEventListener('click', () => {
            imageSelectModal.classList.remove('show');
            updateCreatePostPreview();
        });
    }
}

// Function to update create post preview
function updateCreatePostPreview() {
    const previewContainer = document.getElementById('createPostMedia');
    if (previewContainer && selectedImages.length > 0) {
        previewContainer.innerHTML = selectedImages.map(path => `
            <img src="${path}" alt="Selected media">
        `).join('');
    } else if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}

// Function to check if the user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();
        return data.authenticated;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Function to handle logout
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (window.updateAuthLink) {
                await window.updateAuthLink();
            }
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Logout failed', 'error');
    }
}

// Function to load and display images
async function loadImages() {
    try {
        const response = await fetch('/api/images', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            const mediaGrid = document.getElementById('mediaGrid');
            if (mediaGrid) {
                mediaGrid.innerHTML = data.images.map(image => `
                    <div class="media-item" data-path="${image.path}">
                        <img src="${image.url}" alt="${image.name}">
                        <input type="checkbox" name="images[]" value="${image.path}">
                    </div>
                `).join('');

                // Add click event listeners to media items
                mediaGrid.querySelectorAll('.media-item').forEach(item => {
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    
                    // Set initial state if image was previously selected
                    if (selectedImages.includes(item.dataset.path)) {
                        checkbox.checked = true;
                        item.classList.add('selected');
                    }

                    item.addEventListener('click', (e) => {
                        if (e.target !== checkbox) {
                            checkbox.checked = !checkbox.checked;
                            item.classList.toggle('selected', checkbox.checked);
                            
                            if (checkbox.checked) {
                                if (!selectedImages.includes(item.dataset.path)) {
                                    selectedImages.push(item.dataset.path);
                                }
                            } else {
                                selectedImages = selectedImages.filter(path => path !== item.dataset.path);
                            }
                        }
                    });

                    // Handle direct checkbox clicks
                    checkbox.addEventListener('change', (e) => {
                        item.classList.toggle('selected', e.target.checked);
                        if (e.target.checked) {
                            if (!selectedImages.includes(item.dataset.path)) {
                                selectedImages.push(item.dataset.path);
                            }
                        } else {
                            selectedImages = selectedImages.filter(path => path !== item.dataset.path);
                        }
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error loading images:', error);
        showMessage('Error loading images', 'error');
    }
}

// Function to load and display posts
async function loadPosts() {
    try {
        const response = await fetch('/api/posts', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            const postsContainer = document.getElementById('posts');
            if (postsContainer) {
                postsContainer.innerHTML = data.posts.map(post => `
                    <div class="post" data-id="${post.id}">
                        ${post.media ? `
                            <div class="post-media">
                                ${post.media.map(media => `
                                    <img src="${media.path}" alt="${media.alt || ''}">
                                `).join('')}
                            </div>
                        ` : ''}
                        <div class="post-header">
                            <h3 class="post-title">${post.title}</h3>
                            <span class="post-date">${post.date}</span>
                        </div>
                        <div class="post-body">
                            <div class="post-text">${post.content}</div>
                        </div>
                        <div class="post-actions">
                            <button onclick="editPost('${post.id}')">Edit</button>
                            <button onclick="deletePost('${post.id}')">Delete</button>
                        </div>
                        <form class="post-edit-form">
                            <div class="edit-media">
                                <button type="button" onclick="toggleEditImages('${post.id}')">Edit Images</button>
                                <div class="media-grid edit-media-grid" data-post-id="${post.id}"></div>
                            </div>
                            <input type="text" name="title" value="${post.title}" required>
                            <textarea name="content" required>${post.content.replace(/<br>/g, '\n')}</textarea>
                            <div class="post-actions">
                                <button type="submit">Save</button>
                                <button type="button" onclick="cancelEdit('${post.id}')">Cancel</button>
                            </div>
                        </form>
                    </div>
                `).join('');

                // Initialize dynamic textareas for edit forms
                postsContainer.querySelectorAll('textarea').forEach(textarea => {
                    textarea.addEventListener('input', function() {
                        this.style.height = 'auto';
                        this.style.height = (this.scrollHeight) + 'px';
                    });
                });

                // Add form submit handlers
                postsContainer.querySelectorAll('.post-edit-form').forEach(form => {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const postId = e.target.closest('.post').dataset.id;
                        updatePost(postId, form);
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        showMessage('Error loading posts', 'error');
    }
}

// Function to show messages
function showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = type;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 5000);
    }
}

// Function to edit a post
async function editPost(id) {
    // Hide any other open edit forms first
    document.querySelectorAll('.post-edit-form.show').forEach(form => {
        if (form.closest('.post').dataset.id !== id) {
            form.classList.remove('show');
        }
    });

    const post = document.querySelector(`.post[data-id="${id}"]`);
    if (post) {
        const editForm = post.querySelector('.post-edit-form');
        const textarea = editForm.querySelector('textarea');
        editForm.classList.toggle('show');
        
        // Only adjust height if form is being shown
        if (editForm.classList.contains('show')) {
            // Wait for animation to complete
            setTimeout(() => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }, 10);
        }
        editingPostId = editForm.classList.contains('show') ? id : null;
    }
}

// Function to toggle edit images
async function toggleEditImages(postId) {
    const imageSelectModal = document.getElementById('imageSelectModal');
    editingPostId = postId;
    
    // Clear previous selections
    selectedImages = [];
    
    // Get current post's images
    const post = document.querySelector(`.post[data-id="${postId}"]`);
    const currentImages = post.querySelectorAll('.post-media img');
    currentImages.forEach(img => {
        selectedImages.push(img.src);
    });
    
    // Show modal and refresh images
    imageSelectModal.classList.add('show');
    await loadImages();
}

function cancelEdit(id) {
    const post = document.querySelector(`.post[data-id="${id}"]`);
    if (post) {
        post.querySelector('.post-edit-form').classList.remove('show');
        editingPostId = null;
        selectedImages = []; // Clear selected images when canceling edit
    }
}

// Function to initialize all textareas
function initializeTextareas() {
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        
        // Set initial height
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });
}

// Initialize textareas after loading posts
const originalLoadPosts = loadPosts;
loadPosts = async function() {
    await originalLoadPosts.apply(this, arguments);
    initializeTextareas();
};

// Function to update post
async function updatePost(id, form) {
    try {
        const response = await fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: form.title.value,
                content: form.content.value,
                images: selectedImages
            }),
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            showMessage('Post updated successfully');
            await loadPosts();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showMessage('Failed to update post', 'error');
    }
}

// Function to delete a post
async function deletePost(id) {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            const response = await fetch(`/api/posts/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                showMessage('Post deleted successfully');
                await loadPosts();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            showMessage('Failed to delete post', 'error');
        }
    }
}
