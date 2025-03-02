#
2. Required software:
   - Node.js 14+
   - npm 6+
   - nginx
   - git (optional)

## Installation Steps

### 1. System Setup

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Verify installations
node --version
npm --version
nginx -v
```

### 2. Project Setup

```bash
# Create project directory
mkdir -p /var/www/terminal-blog
cd /var/www/terminal-blog

# Copy project files
# Option 1: Git
git clone <your-repo-url> .

# Option 2: Manual
# Upload your project files to /var/www/terminal-blog

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2
```

### 3. Configuration

#### Create Environment File
```bash
# Create .env file (optional)
cat > .env << EOL
NODE_ENV=production
PORT=3001
EOL
```

#### Configure nginx

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/terminal-blog

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static files directly
    location /media/ {
        alias /var/www/terminal-blog/media/;
    }

    location /css/ {
        alias /var/www/terminal-blog/public/css/;
    }

    location /js/ {
        alias /var/www/terminal-blog/js/;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/terminal-blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. File Permissions

```bash
# Set correct ownership
sudo chown -R www-data:www-data /var/www/terminal-blog

# Set correct permissions
sudo chmod -R 755 /var/www/terminal-blog
sudo chmod -R 777 /var/www/terminal-blog/media  # For uploads
```

### 5. Start the Application

```bash
# Start with PM2
cd /var/www/terminal-blog
pm2 start server.js --name terminal-blog

# Make PM2 start on boot
pm2 startup
pm2 save
```

### 6. Security Setup

```bash
# Install and configure UFW firewall
sudo apt install -y ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Set up SSL with Let's Encrypt (optional)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Maintenance

### Logs
- Application logs: `pm2 logs terminal-blog`
- nginx logs:
  - Access: `sudo tail -f /var/nginx/access.log`
  - Error: `sudo tail -f /var/nginx/error.log`

### Updates
```bash
# Update application
cd /var/www/terminal-blog
git pull  # if using git
npm install
pm2 restart terminal-blog

# Update system
sudo apt update
sudo apt upgrade -y
```

### Backup
```bash
# Backup posts and media
cd /var/www/terminal-blog
tar -czf backup.tar.gz posts.json media/
```

## Troubleshooting

1. **Application won't start**
   - Check logs: `pm2 logs terminal-blog`
   - Verify Node.js version: `node --version`
   - Check file permissions

2. **Can't upload images**
   - Check media directory permissions
   - Verify nginx configuration
   - Check disk space: `df -h`

3. **nginx errors**
   - Check configuration: `sudo nginx -t`
   - Check logs: `sudo tail -f /var/log/nginx/error.log`
   - Verify ports: `sudo netstat -tulpn | grep nginx`

4. **Session issues**
   - Verify tmp directory permissions
   - Check server.js session configuration
   - Clear browser cache and cookies

## Monitoring

```bash
# Monitor application
pm2 monit

# Monitor system resources
htop  # Install with: sudo apt install htop

# Monitor nginx
sudo nginx -v
systemctl status nginx
```

Remember to:
- Regularly backup posts.json and media files
- Monitor disk space, especially the media directory
- Keep the system and Node.js updated
- Check logs periodically for errors
- Set up monitoring for server health
