# 🔐 Stardust Financial Vault - Security & Login Plan

This document outlines the architecture and strategy for the secure login and recovery system.

## 👥 RBAC Plan (Customer + Admin)

### Middleware Implementation
```javascript
// src/middleware/auth.js
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
}
```

### Route Structure
- `/api/admin/*` → Protected by `requireRole('ADMIN')`
- `/api/vault/*` → Protected by `requireRole('CUSTOMER')`

## 📱 OTP via WhatsApp
- **Provider Recommendation:** Twilio WhatsApp API (Robust, well-documented) or Meta Cloud API (Direct, potentially cheaper).
- **Flow:**
  1. Generate 6-digit OTP.
  2. Store bcrypt-hashed OTP in `otp_codes` table.
  3. Send plaintext OTP via WhatsApp.
  4. Expiry: 5 minutes.
  5. Mark as `is_used` upon successful validation.

## 🛡 Security Practices (Mandatory)
- **Password Hashing:** bcrypt with 12 rounds.
- **OTP Storage:** Never store in plaintext; store hashed.
- **JWT Strategy:**
  - Access Token: Short-lived (15 mins).
  - Refresh Token: Stored in HTTP-only, Secure, SameSite cookie.
- **Rate Limiting:** Applied to all `/api/auth/` routes.
- **Account Lock:** Lock account for 30 minutes after 5 failed attempts.
- **Zero-Knowledge:** Encryption keys for vault content are derived from user passwords and never stored on the server.

## 🔁 Account Recovery Flow (OTP-based)
1. **Identification:** User provides Email or Mobile.
2. **Verification:** System sends a 6-digit OTP via WhatsApp using Twilio.
3. **MFA:** User enters the OTP.
4. **Validation:** System verifies the hashed OTP and checks if it's within the 5-minute expiry.
5. **Authorization:** Upon success, a temporary JWT `resetToken` is issued.
6. **Reset:** User sets a new master password.
7. **Cleanup:** `reset_otp_hash` and `reset_verified` flags are cleared.

## 👥 Legacy Recovery (Security Questions)
- A secondary recovery flow using registered security questions is available via `/api/auth/recovery-questions` for cases where WhatsApp is inaccessible.

## 📊 Admin Login Rules
- **2FA Always:** Mandatory OTP for every admin login.
- **Audit Logging:**
  - IP Address
  - Device/User Agent
  - Timestamp
  - Action performed
- **Notifications:** Send email/WhatsApp alert to system owner on every admin login.
- **Data Access Restrictions:** Zero-knowledge architecture ensures admins cannot decrypt user vault content.

## 🎯 Finalizing Decisions (Next Steps)

Before we proceed with the full implementation, we need to finalize:

1. **Token Strategy:**
   - [ ] JWT (Stateless) - Best for scalability.
   - [ ] Sessions (Stateful) - Better for immediate revocation.
   - *Recommendation: JWT with a Redis-backed blacklist for immediate logout capability.*

2. **OTP Provider:**
   - [ ] Twilio (Easier setup)
   - [ ] Meta Cloud API (More direct)
   - *Recommendation: Twilio for Phase 1.*

3. **Password Policy Rules:**
   - Min length: 12+ characters?
   - Complexity: Uppercase, lowercase, numbers, symbols?

4. **Lockout Duration:**
   - 30 minutes? 1 hour? Or exponential backoff?

5. **Refresh Token Strategy:**
   - Rotation? (Issue a new refresh token on every use) - Highly recommended for security.

6. **Audit Log Detail Level:**
   - Just login/logout or every sensitive read/write?
