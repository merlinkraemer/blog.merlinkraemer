const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Basic setup
const app = express();
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Protected admin route
app.get('/admin', checkAuth, (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'views/admin.html'), {
            headers: {
                'Content-Type': 'text/html'
            }
        }, err => {
            if (err) {
                console.error('Error serving admin page:', err);
                res.status(500).send('Error loading admin page');
            }
        });
    } catch (error) {
        console.error('Error serving admin page:', error);
        res.status(500).send('Error loading admin page');
    }
});

// Cache for media files
let mediaCache = null;
let mediaCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// API endpoints for admin
app.get('/api/images', checkAuth, async (req, res) => {
    try {
        const now = Date.now();
        if (mediaCache && (now - mediaCacheTime < CACHE_TTL)) {
            return res.json({ success: true, images: mediaCache });
        }

        const mediaDir = path.join(__dirname, '../../public/media');
        const files = await fs.readdir(mediaDir);
        const images = files.map(file => ({
            name: file,
            path: `/media/${file}`,
            url: `/media/${file}`
        }));

        mediaCache = images;
        mediaCacheTime = now;
        res.json({ success: true, images });
    } catch (err) {
        console.error('Error loading images:', err);
        res.status(500).json({ success: false, error: 'Could not load images' });
    }
});

// File upload setup
const upload = multer({
    dest: path.join(__dirname, '../../public/media/'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'));
        }
    }
});

// Auth check
function checkAuth(req, res, next) {
    if (req.session.authenticated) return next();
    
    // Check if request expects HTML
    const acceptsHtml = req.accepts(['html', 'json']) === 'html';
    
    if (acceptsHtml) {
        // For HTML requests, send a proper redirect
        res.redirect(302, '/login.html');
    } else {
        // For API requests, send JSON response
        res.status(401).json({ error: 'Please login first' });
    }
}

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Check username first
    if (username !== process.env.ADMIN_USERNAME) {
        return res.status(401).json({ success: false, message: 'Wrong username or password' });
    }

    // Compare password with stored hash
    if (bcrypt.compareSync(password, process.env.ADMIN_PASSWORD)) {
        req.session.authenticated = true;
        req.session.username = username;
        res.json({ success: true, redirectUrl: '/admin' });
    } else {
        res.status(401).json({ success: false, message: 'Wrong username or password' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
});

// Blog posts
app.get('/api/posts', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, '../../config/posts.json'), 'utf8')
            .then(JSON.parse)
            .catch(() => ({ posts: [] }));
        res.json({ success: true, ...data });
    } catch (err) {
        console.error('Error loading posts:', err);
        res.status(500).json({ success: false, error: 'Could not load posts' });
    }
});

app.post('/api/posts', checkAuth, async (req, res) => {
    try {
        const { title, content, images } = req.body;
        
        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Title and content are required' 
            });
        }

        const data = await fs.readFile(path.join(__dirname, '../../config/posts.json'), 'utf8')
            .then(JSON.parse)
            .catch(() => ({ posts: [] }));

        const newPost = {
            id: Date.now().toString(),
            title: title.trim(),
            content: content.trim(),
            date: new Date().toISOString().split('T')[0],
            media: images?.map(path => ({ type: 'image', path })) || []
        };

        data.posts.unshift(newPost);

        await fs.writeFile(
            path.join(__dirname, '../../config/posts.json'), 
            JSON.stringify(data, null, 2)
        );

        res.json({ 
            success: true, 
            message: 'Post created successfully',
            post: newPost
        });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Could not save post' 
        });
    }
});

app.delete('/api/posts/:id', checkAuth, async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, '../../config/posts.json'), 'utf8')
            .then(JSON.parse)
            .catch(() => ({ posts: [] }));

        data.posts = data.posts.filter(post => post.id !== req.params.id);
        await fs.writeFile(path.join(__dirname, '../../config/posts.json'), JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Could not delete post' });
    }
});

// Image upload
app.post('/api/upload', checkAuth, upload.array('files'), (req, res) => {
    mediaCache = null; // Clear cache
    res.json({
        success: true,
        files: req.files.map(f => ({
            path: `/media/${f.filename}`,
            url: `/media/${f.filename}`
        }))
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
