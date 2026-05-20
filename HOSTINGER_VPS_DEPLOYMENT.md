# The Ultimate aaPanel & Hostinger VPS Deployment Guide

This guide provides the exact step-by-step process to deploy your full-stack Node.js + React application to a Hostinger VPS using **aaPanel**, complete with automated MySQL database integration.

By following this guide, your backend will automatically connect to the aaPanel MySQL database and generate all necessary tables on startup.

---

## Phase 1: Your Daily Workflow (On Any Computer)
Whenever you make changes to your code locally:
1. Make your code changes.
2. Push them to GitHub using your terminal:
   ```bash
   git add .
   git commit -m "My new updates"
   git push origin main
   ```
*Your code is now safely on GitHub. Now, let's put it on your aaPanel server.*

---

## Phase 2: First-Time Server Setup (Do this ONLY ONCE)

### A. Access your Hostinger VPS and install aaPanel
1. If you haven't already, install aaPanel via your Hostinger VPS dashboard (OS Templates -> aaPanel) or by running the aaPanel installation script via SSH.
2. Log into your **aaPanel Dashboard** through your browser (e.g., `http://<YOUR_VPS_IP>:7890`).
3. On the first login, aaPanel will prompt you to install software. Choose **LNMP** (Nginx, MySQL, PHP, Pure-FTPd, phpMyAdmin) and click **One-click install**. Wait for the installation to finish.

### B. Create Your Website in aaPanel
1. In aaPanel, go to **Website** (on the left menu) -> **Add site**.
2. **Domain:** Enter your domain name (e.g., `yourdomain.com`).
3. **Database:** Choose `MySQL`. This will auto-generate a Database Name, User, and Password. 
   - **IMPORTANT:** Save these database credentials! You will need them for the `.env` file later.
4. **PHP Version:** Select any (we won't use it, as we use Node.js).
5. Click **Submit**. 
   *(This creates a directory for your website at `/www/wwwroot/yourdomain.com`)*

### C. Download Your Code from GitHub to the Server
1. Open your computer's terminal (or aaPanel's built-in Terminal) and SSH into your server:
   ```bash
   ssh root@<YOUR_VPS_IP>
   ```
2. Navigate to your website's folder and clone your repository:
   ```bash
   cd /www/wwwroot/yourdomain.com
   # Remove the default index.html created by aaPanel
   rm -f index.html 404.html
   # Clone your repository (creates a folder called 'app')
   git clone https://github.com/RohitkumarRKS/ITN_medianews.git app
   ```

### D. Setup and Start the Backend (MySQL Integration)
1. Go into the backend folder and install dependencies:
   ```bash
   cd /www/wwwroot/yourdomain.com/app/backend
   npm install
   ```
2. Create your secret environment file (`.env`):
   ```bash
   nano .env
   ```
3. Paste the following configuration, and **REPLACE** the DB values with the ones generated in Step B.3:
   ```ini
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=super_secret_key_123
   
   # MySQL Database Configuration (From aaPanel)
   DB_HOST=127.0.0.1
   DB_USER=your_aapanel_db_user
   DB_PASS=your_aapanel_db_password
   DB_NAME=your_aapanel_db_name
   DB_PORT=3306

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-letter-app-password
   ADMIN_EMAIL=admin-receiver@gmail.com
   ```
   *(Press `Ctrl+X`, then `Y`, then `Enter` to save).*

4. Start the backend globally using PM2:
   ```bash
   # Install pm2 globally if not already installed
   npm install -g pm2
   
   # Start the server
   pm2 start server.js --name "medianews-api"
   pm2 save
   pm2 startup
   ```
   *(When the server starts, Sequelize will automatically connect to your aaPanel MySQL database and create all the required tables!)*

### E. Setup the React Frontend
1. Go into the frontend folder, install dependencies, and build the React app:
   ```bash
   cd /www/wwwroot/yourdomain.com/app/frontend
   npm install
   npm run build
   ```
2. Move the built website to the main domain folder:
   ```bash
   cp -r dist/* /www/wwwroot/yourdomain.com/
   ```

### F. Link Frontend and Backend (Nginx Reverse Proxy in aaPanel)
To make your frontend communicate with the Node.js backend, we need to set up a reverse proxy.
1. Open your **aaPanel Dashboard** in your web browser.
2. Go to **Website** -> Click on your domain name (`yourdomain.com`).
3. In the popup window, click on **URL rewrite** on the left menu.
4. Paste the following Nginx configuration to support React Router and proxy API requests:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }

   location /api/ {
       proxy_pass http://127.0.0.1:5000/api/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }

   location /uploads/ {
       proxy_pass http://127.0.0.1:5000/uploads/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```
5. Click **Save**.

**🎉 Congratulations! Your website is live and connected to MySQL.**

---

## Phase 3: How to Update Your Live Site (The 10-Second Method)
Whenever you push new code to GitHub, run these commands via SSH to update your live server:

### To Update the Entire Website:
```bash
# 1. Download the latest code from GitHub
cd /www/wwwroot/yourdomain.com/app
git pull origin main

# 2. Update the Frontend
cd frontend
npm run build
cp -r dist/* /www/wwwroot/yourdomain.com/

# 3. Update the Backend
cd ../backend
npm install  # in case you added new packages
pm2 restart medianews-api
```
*(That's it! Your live website is instantly updated).*
