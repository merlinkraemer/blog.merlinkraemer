# GAMEDEV BLOG

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
  - `posts.json` - post data storage
  - `media/` - uploads

## Project Structure

```
/
├── server.js           # routes etc.
├── package.json        # node deps
├── nodemon.json        # reload config 
│
├── HTML
│   ├── index.html     
│   ├── about.html     
│   ├── admin.html     
│   └── login.html     
│
├── js/                # Frontend js
│   ├── admin.js       # create and edit posts
│   ├── login.js       # auth handling
│   ├── navigation.js  
│   └── posts.js       # post rendering
│
├── scss/              
│   ├── main.scss      
│   ├── base/          # variables / resets
│   ├── components/    # reusable components
│   └── layout/        # Layouts + responsives
│
├── public/            # Compiled 
│   └── css/          
│
└── media/            # Uploads
```


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

