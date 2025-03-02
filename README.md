# BLOG.MERLINKRAEMER

Author: Merlin Krämer
Created: 01.03.25

## Overview

### Frontend
- **HTML/CSS/JavaScript**
- **SCSS**
- **Browser-Sync** - for live reload dev

### Backend
- **Node.js**
- **Express** 
- **express-session** - Session auth
- **multer** - File upload

### Data Storage
- **File System**
  - `config/posts.json` - post data storage
  - `public/media/` - uploads

## Project Structure

```
/
├── src/
│   ├── server/        # Backend
│   │   └── server.js  # Express server
│   │
│   └── client/        # Frontend source
│       ├── js/        # JavaScript modules
│       │   ├── admin.js
│       │   ├── login.js
│       │   ├── navigation.js
│       │   └── posts.js
│       │
│       └── scss/      # Styles
│           ├── main.scss
│           ├── base/
│           ├── components/
│           └── layout/
│
├── public/            # Static files
│   ├── index.html
│   ├── about.html
│   ├── admin.html
│   ├── login.html
│   ├── css/          # Compiled CSS
│   ├── js/           # Client-side JS
│   └── media/        # Uploaded files
│
├── config/           # Configuration
│   ├── posts.json    # Blog posts data
│   ├── nginx.conf
│   └── .htaccess
│
├── scripts/         # Utility scripts
│   └── generate-hash.js
│
├── package.json
├── .env            # Environment variables
└── .env.example    # Environment template
```

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   ```
   PORT=3001
   SESSION_SECRET=your-secret-key
   ADMIN_USERNAME=your-username
   ADMIN_PASSWORD=your-password
   SALT=your-32-character-salt
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build CSS:
   ```bash
   npm run build
   ```
5. Start development server:
   ```bash
   npm run dev
   ```
   This will start:
   - Node.js server on port 3001
   - Browser-sync on port 3000
   - SCSS watcher
   
   Access the site at: http://localhost:3000

## Development Scripts

- `npm start` - Start production server
- `npm run dev` - Start development environment
- `npm run dev:server` - Start server with nodemon
- `npm run dev:sass` - Watch SCSS changes
- `npm run dev:sync` - Start browser-sync
- `npm run build` - Build production CSS

## API 

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout` 

### Blog Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create posts
  ```json
  {
    "title": "string",
    "content": "string",
    "images": ["string"] // can be multiple --> array
  }
  ```
- `DELETE /api/posts/:id` - delete posts

### File Upload
- `POST /api/upload` 
  - max file size: 5MB
  - types: images / gifs
