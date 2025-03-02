// Function to format date in [YYYY-MM-DD] format
function formatDate(date) {
    const d = new Date(date);
    return `[${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}]`;
}

// Function to create carousel HTML
function createCarouselHTML(media) {
    if (media.length === 1) {
        return `<img src="${media[0].path}" alt="${media[0].alt || ''}" loading="lazy">`;
    }
    
    return `
        <div class="carousel" data-current="0">
            <div class="carousel-images">
                ${media.map((m, i) => `
                    <img src="${m.path}" alt="${m.alt || ''}" loading="lazy" class="${i === 0 ? 'active' : ''}" data-index="${i}">
                `).join('')}
            </div>
            <div class="carousel-nav">
                <span class="prev" onclick="prevImage(this)">[<]</span>
                <span class="carousel-counter">1/${media.length}</span>
                <span class="next" onclick="nextImage(this)">[>]</span>
            </div>
        </div>
    `;
}

// Carousel navigation functions
function updateCarousel(carousel, newIndex) {
    const images = carousel.querySelectorAll('.carousel-images img');
    const totalImages = images.length;
    
    // Handle looping
    if (newIndex >= totalImages) newIndex = 0;
    if (newIndex < 0) newIndex = totalImages - 1;

    const currentIndex = parseInt(carousel.dataset.current);
    images[currentIndex].classList.remove('active');
    images[newIndex].classList.add('active');
    
    carousel.querySelector('.carousel-counter').textContent = `${newIndex + 1}/${totalImages}`;
    carousel.dataset.current = newIndex;
}

function nextImage(button) {
    const carousel = button.closest('.carousel');
    const currentIndex = parseInt(carousel.dataset.current);
    updateCarousel(carousel, currentIndex + 1);
}

function prevImage(button) {
    const carousel = button.closest('.carousel');
    const currentIndex = parseInt(carousel.dataset.current);
    updateCarousel(carousel, currentIndex - 1);
}

// Function to create post HTML
function createPostHTML(post) {
    return `
        <article class="post">
            ${post.media && post.media.length > 0 ? `
                <div class="post-media">
                    ${createCarouselHTML(post.media)}
                </div>
            ` : ''}
            <div class="post-header">
                <h2 class="post-title">${post.title}</h2>
                <span class="post-date">${formatDate(post.date)}</span>
            </div>
            <div class="post-body">
                <div class="post-text">${post.content}</div>
            </div>
        </article>
    `;
}

// Function to load posts
async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        
        if (data.success && data.posts) {
            const postsContainer = document.getElementById('posts');
            const sortedPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            postsContainer.innerHTML = sortedPosts.map(createPostHTML).join('');
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('posts').innerHTML = '<p class="error">Error loading posts. Please refresh the page.</p>';
    }
}

// Make carousel functions globally available
window.nextImage = nextImage;
window.prevImage = prevImage;
