#  End-to-End Encrypted File Sharing System - Backend

A production-ready Node.js + Express backend for secure file sharing with **client-side AES-256-GCM encryption**. The server NEVER has access to plaintext files or encryption keys.

##  Key Features

- **AES-256-GCM Encryption**: Files encrypted client-side before upload
- **PBKDF2 Key Derivation**: Secure password-based key derivation (100,000 iterations)
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: Encrypted file metadata storage
- **Rate Limiting**: Protection against abuse
- **CORS Support**: Secure cross-origin requests
- **File Expiration**: Auto-delete expired shared files
- **Comprehensive Logging**: Detailed encryption/decryption logs

##  Requirements

- Node.js 18+
- MongoDB Atlas account
- npm or yarn

##  Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/e2e-file-sharing
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=104857600
```

### 3. Create MongoDB Atlas Database

1. Sign up at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Replace in `.env` as `MONGO_URI`

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

##  Encryption Architecture

### Upload Flow

```
1. Frontend: Generate AES-256 key & IV
2. Frontend: Encrypt file with AES-GCM
3. Frontend: Extract authentication tag
4. Frontend: Store key in sessionStorage
5. Backend: Receive encrypted file + IV + authTag
6. Backend: Store encrypted data (never decrypt)
7. Backend: Save metadata in MongoDB
```

### Download Flow

```
1. Frontend: Request encrypted file
2. Backend: Return encrypted file + metadata
3. Frontend: Retrieve key from sessionStorage
4. Frontend: Decrypt with AES-256-GCM
5. Frontend: Verify authentication tag
6. Frontend: Trigger download
```

### Share Flow (Password-Protected)

```
1. Frontend: Generate random salt (16 bytes)
2. Frontend: Send salt to backend
3. Backend: Store salt with file metadata
4. Recipient: Enter password
5. Recipient: Derive key using PBKDF2 (100,000 iterations)
6. Recipient: Decrypt file with derived key
```

##  API Endpoints

### Authentication

**POST** `/api/auth/register`

- Body: `{ name, email, password, confirmPassword }`
- Returns: `{ token, user }`

**POST** `/api/auth/login`

- Body: `{ email, password }`
- Returns: `{ token, user }`

**GET** `/api/auth/me`

- Headers: `Authorization: Bearer <token>`
- Returns: `{ user }`

### Files (Authenticated)

**POST** `/api/files/upload`

- Headers: `Authorization: Bearer <token>`
- Form Data: `file, iv, authTag, originalName`
- Returns: `{ file }`

**GET** `/api/files`

- Headers: `Authorization: Bearer <token>`
- Query: `page=1&limit=10`
- Returns: `{ files, pagination }`

**GET** `/api/files/:id`

- Headers: `Authorization: Bearer <token>`
- Returns: `{ file }`

**GET** `/api/files/:id/download`

- Headers: `Authorization: Bearer <token>`
- Returns: Encrypted file binary + headers (IV, authTag)

**DELETE** `/api/files/:id`

- Headers: `Authorization: Bearer <token>`
- Returns: `{ success }`

**POST** `/api/files/:id/share`

- Headers: `Authorization: Bearer <token>`
- Body: `{ shareSalt, expiresIn }`
- Returns: `{ shareToken, shareUrl, expiresAt }`

### Files (Public - Shared)

**GET** `/api/files/shared/:token`

- Returns: `{ file }`

**GET** `/api/files/shared/:token/download`

- Returns: Encrypted file binary + headers (IV, authTag, shareSalt)

##  Security Features

### Password Hashing

- Algorithm: **bcryptjs** (10 rounds)
- Used for user authentication

### JWT Tokens

- Algorithm: **HS256**
- Expiration: 7 days (configurable)
- Secure token validation on all protected routes

### File Encryption

- Algorithm: **AES-256-GCM** (client-side)
- Server stores: Encrypted data, IV, authTag only
- Server never stores: Plaintext or encryption key

### Key Derivation (Shared Files)

- Algorithm: **PBKDF2-SHA256**
- Iterations: 100,000
- Salt: 16 bytes (cryptographically random)
- Output: 256-bit AES key

### Rate Limiting

- Auth endpoints: 5 requests per 15 minutes
- Upload endpoints: 50 uploads per hour
- API endpoints: 100 requests per 15 minutes

##  Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### File Collection

```javascript
{
  _id: ObjectId,
  filename: String,
  originalName: String,
  size: Number,
  mimeType: String,
  encryptionIv: String (base64),
  encryptionAuthTag: String (base64),
  encryptedOnClient: Boolean (true),
  owner: ObjectId (ref: User),
  isPublic: Boolean,
  shareToken: String (unique, sparse),
  shareSalt: String (base64),
  expiresAt: DateTime (optional),
  accessCount: Number,
  lastAccessedAt: DateTime,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

##  Deployment

### Deploy on Render

1. Push code to GitHub
2. Connect to Render
3. Set environment variables:
   ```
   MONGO_URI=your_mongo_atlas_uri
   JWT_SECRET=random_secret_key
   CLIENT_URL=your_frontend_url
   NODE_ENV=production
   ```
4. Deploy

### Deploy on Railway

1. Push code to GitHub
2. Connect to Railway
3. Add MongoDB service
4. Set environment variables
5. Deploy

### Deploy on AWS

1. Use EC2 + Node.js runtime
2. Set up RDS for MongoDB or use MongoDB Atlas
3. Configure security groups
4. Set environment variables in `.env`
5. Use PM2 for process management

##  Testing

### Test Upload & Download

```bash
# 1. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!","confirmPassword":"Test123!"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 3. Upload file (frontend handles encryption)
# Use the frontend app to upload

# 4. List files
curl -X GET http://localhost:5000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Encryption Integrity

- Upload a file
- Try to modify encrypted data on server
- Attempt to download
- Should see: "File integrity compromised" in browser console

### Test Shared Files

1. Create a file in dashboard
2. Click "Share" and set password
3. Copy share link
4. Open link in new tab/incognito
5. Enter password to decrypt

##  Logging

All encryption/decryption operations are logged:

```
 File uploaded successfully
 File encrypted successfully with AES-256-GCM
 File decrypted successfully with AES-256-GCM
 Encryption error: ...
```

##  Troubleshooting

### MongoDB Connection Error

- Check `MONGO_URI` in `.env`
- Verify MongoDB Atlas IP whitelist
- Ensure network connectivity

### Upload Fails

- Check file size (< 100MB default)
- Verify JWT token validity
- Check server logs for errors

### Decryption Fails

- Verify encryption key exists in sessionStorage
- Check if file was tampered
- Clear browser cache and try again

##  Architecture Overview

```
Backend
 src/
    config/
       database.js (MongoDB connection)
    models/
       User.js
       File.js
    controllers/
       authController.js
       fileController.js
    routes/
       auth.js
       files.js
    middleware/
       auth.js (JWT validation)
       errorHandler.js
       rateLimiter.js
    utils/
       jwt.js
       bcrypt.js
       crypto.js (token generation)
    server.js (main entry point)
 uploads/ (encrypted files storage)
 package.json
 .env
```

##  Security Best Practices

 HTTPS only in production
 Never log sensitive data
 Use strong JWT secrets
 Validate all inputs
 Rate limit authentication endpoints
 Use CORS properly
 Store keys in sessionStorage (not localStorage)
 Implement CSRF protection on frontend
 Regular security audits

##  License

MIT

---

** IMPORTANT**: Change `JWT_SECRET` in production! Use a strong, random value.


