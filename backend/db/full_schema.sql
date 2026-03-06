-- 🌌 STARDUST FINANCIAL VAULT - FULL DATABASE SCHEMA
-- Engine: InnoDB | Charset: utf8mb4

CREATE DATABASE IF NOT EXISTS stardust;
USE stardust;

-- 👤 1. USERS TABLE (Core Identity)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER', 'ADMIN', 'NOMINEE') DEFAULT 'CUSTOMER',
    is_verified BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    failed_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    reset_otp_hash VARCHAR(255) DEFAULT NULL,
    reset_otp_expires_at DATETIME NULL,
    reset_verified BOOLEAN DEFAULT 0,
    reset_security_attempts INT DEFAULT 0,
    reset_otp_attempts INT DEFAULT 0,
    address TEXT DEFAULT NULL,
    gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
    dob DATE DEFAULT NULL,
    has_completed_onboarding BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 👥 NOMINEES TABLE (Legacy Contacts)
CREATE TABLE IF NOT EXISTS nominees (
    nominee_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    mobile VARCHAR(20) DEFAULT NULL,
    relationship VARCHAR(100) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 🔐 2. AUTHENTICATION & SECURITY TABLES
CREATE TABLE IF NOT EXISTS otp_codes (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_code VARCHAR(255) NOT NULL, -- Hashed OTP
    channel ENUM('EMAIL', 'WHATSAPP', 'WHATSAPP_NOMINEE') NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS security_questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_security_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_hash VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES security_questions(question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 🧱 3. ASSET TABLES (Zero-Knowledge Metadata)
-- General Assets table to store any type with flexible metadata
CREATE TABLE IF NOT EXISTS assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('Credit Card', 'Bank Account', 'Insurance', 'Property', 'Legal Document', 'Nominee', 'Password', 'Investment', 'Vehicle', 'Collectible') NOT NULL,
    title VARCHAR(255) NOT NULL,
    metadata JSON NOT NULL, -- Stores the encrypted or non-sensitive fields
    is_encrypted BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit Logs for sensitive actions
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    device_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial security questions
INSERT IGNORE INTO security_questions (question) VALUES 
('What was the name of your first pet?'),
('What is your mother''s maiden name?'),
('What was the name of your first school?'),
('In which city were you born?'),
('What is your favorite book?');
