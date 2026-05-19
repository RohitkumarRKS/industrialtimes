# 🌐 Comprehensive Hostinger VPS KVM 2 Deployment Guide

This guide provides a step-by-step roadmap to host your React Vite frontend and Node.js Express backend (with SQLite) on a **Hostinger VPS KVM 2** server running **Ubuntu 22.04 LTS**.

By the end of this guide, your application will run under a production-grade process manager (**PM2**), reverse-proxied securely through **Nginx**, and encrypted with a free **Let's Encrypt SSL** certificate.

---

## 📌 Architecture Design for Production
To ensure premium performance, security, and zero CORS issues, we use a single-port Nginx reverse-proxy setup:
* **Vite Static Build**: Served directly by Nginx (ultra-fast static asset delivery).
* **Express Backend (API)**: PM2 daemon running on port `5000`, internally proxied by Nginx through `/api`.
* **Database**: Embedded SQLite database (`database.sqlite`) residing in the backend directory.

---

## 🛠️ Step 1: Accessing Your Hostinger VPS & Initial Server Setup

1. **Get VPS Credentials**:
   - Log in to your **Hostinger hPanel**.
   - Navigate to **VPS** -> **Manage** -> **SSH Details**. Note down your **IP Address**, **Username** (`root`), and **Password**.
   - Ensure the OS is set to **Ubuntu 22.04 LTS** (reinstall from the OS panel if necessary).

2. **Connect to Your VPS via SSH**:
   - Open PowerShell or command terminal on your Windows machine and run:
     ```bash
     ssh root@YOUR_VPS_IP_ADDRESS
     ```
   - Type `yes` when prompted, and enter your Hostinger root password.

3. **Update Server Packages**:
   - Run the following commands to ensure all system repositories are up to date:
     ```bash
     sudo apt update && sudo apt upgrade -y
     ```

4. **Install Core Utilities**:
   - Install essential building blocks:
     ```bash
     sudo apt install -y git curl wget unzip build-essential nginx
     ```

---

## 📦 Step 2: Install Node.js, npm, and SQLite3

1. **Install Node.js (LTS Version 20)**:
   - Setup NodeSource repository and install:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt install -y nodejs
     ```
   - Verify installation:
     ```bash
     node -v
     npm -v
     ```

2. **Install SQLite3 CLI**:
   - Ensure SQLite development libraries are present:
     ```bash
     sudo apt install -y sqlite3 libsqlite3-dev
     ```

---

## 🚀 Step 3: Clone Codebase & Install Dependencies

1. **Create Web Directory**:
   - Create a clean deployment folder under `/var/www`:
     ```bash
     sudo mkdir -p /var/www/media-platform
     sudo chown -R $USER:$USER /var/www/media-platform
     cd /var/www/media-platform
     ```

2. **Deploy Codebase**:
   - Option A: Clone directly from your Git repository:
     ```bash
     git clone YOUR_GIT_REPO_URL .
     ```
   - Option B: Upload using SFTP (using **FileZilla**):
     - Connect using Host (sftp://YOUR_VPS_IP), username (`root`), password, and port `22`.
     - Drag and drop your local `backend` and `frontend` folders into `/var/www/media-platform/`.

3. **Configure Backend Environment**:
   - Navigate to the backend directory and create a production `.env` file:
     ```bash
     cd /var/www/media-platform/backend
     nano .env
     ```
   - Add your production configurations:
     ```ini
     PORT=5000
     NODE_ENV=production
     JWT_SECRET=YOUR_SUPER_SECRET_RANDOM_STRING
     
     # SQLITE DATABASE PATH
     DB_PATH=/var/www/media-platform/backend/database.sqlite
     
     # RAZORPAY KEYS
     RAZORPAY_KEY_ID=YOUR_LIVE_RAZORPAY_KEY_ID
     RAZORPAY_KEY_SECRET=YOUR_LIVE_RAZORPAY_KEY_SECRET
     ```
   - Save and exit (Press `CTRL + O`, then `Enter`, then `CTRL + X`).

4. **Install Node Dependencies**:
   - Install backend modules:
     ```bash
     npm install
     ```
   - Install frontend modules & build React bundle:
     ```bash
     cd /var/www/media-platform/frontend
     npm install
     npm run build
     ```
     *(This compiles all React/Vite code into highly-optimized static files in `/var/www/media-platform/frontend/dist`)*.

---

## 🔄 Step 4: Configure PM2 Process Manager

PM2 keeps your Express backend running continuously in the background and restarts it automatically if the VPS crashes or restarts.

1. **Install PM2 Globally**:
   ```bash
   sudo npm install -g pm2
   ```

2. **Start the Backend Server**:
   ```bash
   cd /var/www/media-platform/backend
   pm2 start server.js --name "media-backend"
   ```

3. **Configure Auto-Restart on Boot**:
   ```bash
   pm2 startup systemd
   ```
   - PM2 will output a command starting with `sudo env PATH=...`. **Copy and run that exact command** in the terminal to register the boot service.
   - Save the current process list configuration:
     ```bash
     pm2 save
     ```

4. **Check Server Status**:
   ```bash
   pm2 status
   pm2 logs media-backend
   ```

---

## 🌐 Step 5: Configure Nginx Web Server & Reverse Proxy

We configure Nginx to serve the React assets directly and proxy API requests back to our local port `5000`.

1. **Configure Firewall**:
   - Allow Nginx HTTP and HTTPS ports through Ubuntu firewall:
     ```bash
     sudo ufw allow 'Nginx Full'
     sudo ufw allow OpenSSH
     sudo ufw --force enable
     ```

2. **Create Nginx Configuration File**:
   - Open a new server block file for your domain:
     ```bash
     sudo nano /etc/nginx/sites-available/media-platform
     ```
   - Add the following configuration (replace `yourdomain.com` with your active domain name):
     ```nginx
     server {
         listen 80;
         server_name yourdomain.com www.yourdomain.com;

         # FRONTEND STATIC FILES
         root /var/www/media-platform/frontend/dist;
         index index.html;

         # REACT ROUTER SUPPORT (Fall back to index.html for clientside routing)
         location / {
             try_files $uri $uri/ /index.html;
         }

         # BACKEND REVERSE PROXY
         location /api {
             proxy_pass http://localhost:5000;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection 'upgrade';
             proxy_set_header Host $host;
             proxy_cache_bypass $http_upgrade;
             
             # Increase timeouts for file uploads
             proxy_connect_timeout 600;
             proxy_send_timeout 600;
             proxy_read_timeout 600;
             send_timeout 600;
             client_max_body_size 50M;
         }

         # UPLOADED MEDIA STORES
         location /uploads {
             alias /var/www/media-platform/backend/uploads;
             expires 30d;
             add_header Cache-Control "public, no-transform";
         }
     }
     ```
   - Save and exit (`CTRL + O`, then `Enter`, then `CTRL + X`).

3. **Enable Configuration & Restart Nginx**:
   - Link the server block configuration:
     ```bash
     sudo ln -s /etc/nginx/sites-available/media-platform /etc/nginx/sites-enabled/
     ```
   - Test Nginx syntax correctness:
     ```bash
     sudo nginx -t
     ```
     *(Should return: `nginx: configuration file /etc/nginx/nginx.conf test is successful`)*
   - Reload Nginx:
     ```bash
     sudo systemctl restart nginx
     ```

---

## 🔒 Step 6: Secure the Server with Free SSL (HTTPS)

Let's Encrypt provides fully free SSL certificates that auto-renew.

1. **Install Certbot**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain SSL Certificate**:
   - Run Certbot with the Nginx plugin (replace `yourdomain.com` with your actual domain):
     ```bash
     sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
     ```
   - Enter your email address and accept terms.
   - Choose `2` to automatically redirect all HTTP traffic to secure HTTPS.

3. **Verify SSL Auto-Renewal**:
   - Let's Encrypt certificates last 90 days. Certbot installs a system cron job to renew them automatically. Verify renewal works:
     ```bash
     sudo certbot renew --dry-run
     ```

---

## 📂 Step 7: Fix Folder Permissions for Uploads

Ensure that Node.js and SQLite can write to their respective folders cleanly:

```bash
sudo chown -R www-data:www-data /var/www/media-platform/backend/uploads
sudo chown -R www-data:www-data /var/www/media-platform/backend/database.sqlite
sudo chmod -R 775 /var/www/media-platform/backend/uploads
```

---

## 🎉 Congratulations! Your Website is Live!
Access your website via `https://yourdomain.com`. 

### 💡 Quick VPS Operations Command Sheet:
* **View backend console logs**: `pm2 logs media-backend`
* **Restart the backend app**: `pm2 restart media-backend`
* **Restart Nginx server**: `sudo systemctl restart nginx`
* **Check VPS memory use**: `free -h`
* **Check disk space utilization**: `df -h`
