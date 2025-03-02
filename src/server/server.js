const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const multer = require('multer');
require('dotenv').config();

// Basic setup
const app = express();
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

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
    res.status(401).json({ error: 'Please login first' });
}

// Login/Logout
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Wrong username or password' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Blog posts
app.get('/api/posts', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, '../../config/posts.json'), 'utf8')
            .then(JSON.parse)
            .catch(() => ({ posts: [] }));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Could not load posts' });
    }
});

app.post('/api/posts', checkAuth, async (req, res) => {
    try {
        const { title, content, images } = req.body;
        const data = await fs.readFile(path.join(__dirname, '../../config/posts.json'), 'utf8')
            .then(JSON.parse)
            .catch(() => ({ posts: [] }));

        data.posts.unshift({
            id: Date.now().toString(),
            title,
            content,
            date: new Date().toISOString().split('T')[0],
            media: images?.map(path => ({ type: 'image', path })) || []
        });

        await fs.writeFile(path.join(__dirname, '../../config/posts.json'), JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Could not save post' });
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
    res.json({
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
