# Hostinger Deployment & Database Guide

This guide explains how to set up your MySQL database on Hostinger and deploy the Industrial Times Node.js backend.

## 1. Database Setup (MySQL)

Log in to your Hostinger hPanel and follow these steps:
1. Navigate to **Databases** -> **MySQL Databases**.
2. Create a new database and user:
   - **MySQL Database Name**: `u123456789_industrial`
   - **MySQL Username**: `u123456789_admin`
   - **Password**: *[Create a strong password]*
3. Once created, note down the **Database Name**, **Username**, and **Host** (usually `localhost`).

### Dummy Database Schema (SQL)

You can run this SQL in **phpMyAdmin** to set up your tables:

```sql
-- Users Table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'author', 'superadmin') DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL
);

-- Articles Table
CREATE TABLE Articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image VARCHAR(255),
    category VARCHAR(255),
    authorId INT,
    trending BOOLEAN DEFAULT FALSE,
    publishedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (authorId) REFERENCES Users(id) ON DELETE SET NULL
);

-- Initial Superadmin (Run this after setting up)
-- Replace 'password_hash' with a bcrypt hashed password
INSERT INTO Users (name, email, password, role) 
VALUES ('Super Admin', 'admin@industrialtimes.com', 'password_hash', 'superadmin');
```

## 2. Connecting the Backend

In your backend folder, update your `.env` file with the Hostinger details:

```env
DB_NAME=u123456789_industrial
DB_USER=u123456789_admin
DB_PASS=your_password
DB_HOST=localhost
JWT_SECRET=your_super_secret_key
```

## 3. Deploying to Hostinger

1. **Upload Files**: Use the **File Manager** or **FTP** to upload your `backend` folder to the `domains/yourdomain.com/public_html` directory (or a subdirectory like `api`).
2. **Node.js Configuration**:
   - Hostinger supports Node.js on VPS plans. If you are on Shared Hosting, check if "Node.js" is available in your hPanel.
   - Set the **Application Root** to your backend folder.
   - Set the **Startup File** to `server.js`.
3. **Install Dependencies**: Run `npm install` via the SSH Terminal in Hostinger.
4. **Restart App**: Use the "Restart" button in the Node.js selector.

## 4. Frontend Integration

Update your frontend API URL to point to your Hostinger domain:
`const API_URL = "https://yourdomain.com/api";`
