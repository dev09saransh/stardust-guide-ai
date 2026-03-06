-- 🧱 PART 1 – Fix & Upgrade Your DB Schema

-- 🔐 1️⃣ Add Authentication Fields to users
ALTER TABLE users
ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL,
ADD COLUMN mobile VARCHAR(20) UNIQUE NOT NULL,
ADD COLUMN password_hash VARCHAR(255) NOT NULL,
ADD COLUMN role ENUM('CUSTOMER','ADMIN') DEFAULT 'CUSTOMER',
ADD COLUMN is_verified BOOLEAN DEFAULT 0,
ADD COLUMN is_active BOOLEAN DEFAULT 1,
ADD COLUMN failed_attempts INT DEFAULT 0,
ADD COLUMN locked_until DATETIME NULL;

-- 🔐 2️⃣ Add OTP Table
CREATE TABLE otp_codes (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    channel ENUM('EMAIL','WHATSAPP') NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 🔐 3️⃣ Add Security Questions Table
CREATE TABLE security_questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL
);

CREATE TABLE user_security_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_hash VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES security_questions(question_id)
);

-- Note: Never store answers in plain text. Use answer_hash.
