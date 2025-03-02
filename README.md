# blog.merlinkraemer

Author: Merlin Krämer

Created: 01.03.25

```
      ___           ___           ___           ___                   ___     
     /\__\         /\  \         /\  \         /\__\      ___        /\__\    
    /::|  |       /::\  \       /::\  \       /:/  /     /\  \      /::|  |   
   /:|:|  |      /:/\:\  \     /:/\:\  \     /:/  /      \:\  \    /:|:|  |   
  /:/|:|__|__   /::\~\:\  \   /::\~\:\  \   /:/  /       /::\__\  /:/|:|  |__ 
 /:/ |::::\__\ /:/\:\ \:\__\ /:/\:\ \:\__\ /:/__/     __/:/\/__/ /:/ |:| /\__\
 \/__/~~/:/  / \:\~\:\ \/__/ \/_|::\/:/  / \:\  \    /\/:/  /    \/__|:|/:/  /
       /:/  /   \:\ \:\__\      |:|::/  /   \:\  \   \::/__/         |:/:/  / 
      /:/  /     \:\ \/__/      |:|\/__/     \:\  \   \:\__\         |::/  /  
     /:/  /       \:\__\        |:|  |        \:\__\   \/__/         /:/  /   
     \/__/         \/__/         \|__|         \/__/                 \/__/    

```

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
│   └── client/        # Frontend 
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
├── public/            # Static
│   ├── index.html
│   ├── about.html
│   ├── admin.html
│   ├── login.html
│   ├── css/          # Compiled CSS
│   ├── js/           # Client JS
│   └── media/        # Uploaded files
│
├── config/           
│   ├── posts.json    # Blog posts data
│   ├── nginx.conf
│   └── .htaccess
│
├── scripts/         
│   └── generate-hash.js
│
└──package.json
```

## Development Scripts

- `npm start` - Start prod server
- `npm run dev` - Start dev environment
- `npm run dev:server` - Start server w nodemon
- `npm run dev:sass` - Watch SCSS
- `npm run dev:sync` - browser-sync
- `npm run build` - Build CSS

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
    "images": ["string"]
  }
  ```
- `DELETE /api/posts/:id` - delete posts

### File Upload
- `POST /api/upload` 
  - max file size: 5MB
  - types: images / gifs
