# End-to-End Encrypted File Sharing System

A **production-ready MERN stack** application for secure file sharing with **client-side AES-256-GCM encryption**. The server never has access to plaintext files or encryption keys.

## Features

- **AES-256-GCM Encryption**: Military-grade file encryption
- **PBKDF2 Key Derivation**: Secure password-based key derivation (100,000 iterations)
- **Client-Side Encryption**: Files encrypted before upload
- **JWT Authentication**: Secure token-based auth
- **Password-Protected Sharing**: Share files with passwords
- **File Expiration**: Auto-delete expired shares
- **Rate Limiting**: Protection against abuse
- **Responsive UI**: Works on all devices
- **Comprehensive Logging**: See encryption process in console
- **MongoDB Integration**: Secure metadata storage

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
│  (AES-256-GCM Encryption / PBKDF2 Key Derivation)          │
│              Web Crypto API - SessionStorage               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     │ (Encrypted Data + IV + AuthTag)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express Backend                           │
│              (Never Decrypts, Only Stores)                 │
│    JWT Auth / Rate Limiting / CORS / Error Handling       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              MongoDB Atlas + File Storage                   │
│         (Encrypted Files + Metadata Only)                  │
└─────────────────────────────────────────────────────────────┘
```

## Security Model

### Encryption Guarantees

| Component   | Encryption        | Who Has Key |
| ----------- | ----------------- | ----------- |
| Files       | AES-256-GCM       | Client only |
| Keys        | In sessionStorage | Client only |
| Passwords   | PBKDF2 derived    | Client only |
| JWT Tokens  | HS256 signed      | Server only |
| Connections | TLS/HTTPS         | Both        |

### Threat Mitigation

| Threat                 | Mitigation                      |
| ---------------------- | ------------------------------- |
| Man-in-the-Middle      | HTTPS/TLS encryption            |
| Server Breach          | Client-side encryption          |
| Key Theft              | SessionStorage (not persistent) |
| File Tampering         | AES-GCM authentication tag      |
| Brute Force (Password) | PBKDF2 with 100,000 iterations  |
| Brute Force (Auth)     | Rate limiting                   |

## Tech Stack

### Frontend

- **React 18**: UI library
- **Vite**: Build tool & dev server
- **Web Crypto API**: Client-side encryption
- **Axios**: HTTP client
- **React Router**: Navigation

### Backend

- **Node.js**: Runtime
- **Express**: Web framework
- **MongoDB**: Database
- **Multer**: File upload handling
- **JWT**: Authentication
- **bcryptjs**: Password hashing
- **Express Rate Limit**: API protection

### Infrastructure

- **MongoDB Atlas**: Cloud database
- **Vercel/Netlify**: Frontend hosting
- **Render/Railway/AWS**: Backend hosting

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Git

### 1. Clone Repository

```bash
cd e:\minorbanaobikaro
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB URI and secrets
# MONGO_URI=mongodb+srv://...
# JWT_SECRET=your-secret-key
# CLIENT_URL=http://localhost:5173
```

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local
# VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Start Development

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Server runs at http://localhost:5000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### 5. Access Application

Open browser and go to: `http://localhost:5173`

1. Register new account
2. Upload a file (encrypted automatically)
3. Download to verify decryption
4. Share with password

## Project Structure

```
e:\minorbanaobikaro/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── File.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── fileController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── files.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── bcrypt.js
│   │   │   └── crypto.js
│   │   └── server.js
│   ├── uploads/
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── FileList.jsx
│   │   │   └── UserProfile.jsx
│   │   ├── pages/
│   │   │   ├── Register.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── SharedFile.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── encryption.js
│   │   │   └── storage.js
│   │   ├── styles/
│   │   │   ├── Auth.css
│   │   │   ├── Dashboard.css
│   │   │   ├── Components.css
│   │   │   └── SharedFile.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── .gitignore
│
└── README.md (this file)
```

## Encryption Flow

### File Upload

```javascript
// Frontend
1. User selects file
2. Generate AES-256 key: const key = await generateAESKey()
3. Generate IV: const iv = generateIV() // 12 bytes
4. Encrypt: const encrypted = await encryptFile(file, key, iv)
5. Extract authTag from last 16 bytes
6. Store key: storeKey(fileId, key)
7. Send encrypted data + IV + authTag to backend
```

### File Download

```javascript
// Frontend
1. Retrieve key: const key = retrieveKey(fileId)
2. Download encrypted file + IV from backend
3. Decrypt: const decrypted = await decryptFile(encrypted, key, iv)
4. Verify authentication tag (automatic in Web Crypto)
5. Trigger browser download
```

### Password-Protected Share

```javascript
// Sender
1. Generate salt: const salt = generateSalt()
2. Send salt to backend for storage

// Recipient
1. Enter password
2. Derive key: const key = await deriveKeyFromPassword(password, salt)
3. Download encrypted file + salt
4. Decrypt using derived key
5. If wrong password: Decryption fails
```

## API Documentation

See [backend/README.md](backend/README.md) for complete API documentation.

### Key Endpoints

```
POST   /api/auth/register          - Register user
POST   /api/auth/login             - Login user
GET    /api/auth/me                - Get current user
POST   /api/files/upload           - Upload encrypted file
GET    /api/files                  - List user files
GET    /api/files/:id/download     - Download encrypted file
DELETE /api/files/:id              - Delete file
POST   /api/files/:id/share        - Share file
GET    /api/files/shared/:token    - Get shared file info
GET    /api/files/shared/:token/download - Download shared file
```

## Production Deployment

### Backend Deployment

#### Option 1: Render (Recommended)

```bash
# 1. Push code to GitHub
# 2. Connect GitHub to Render
# 3. Create new Web Service
# 4. Set Environment Variables:
MONGO_URI=mongodb+srv://...
JWT_SECRET=production-secret-key
CLIENT_URL=https://your-frontend.com
NODE_ENV=production

# 5. Deploy
```

#### Option 2: Railway

```bash
# 1. Push to GitHub
# 2. Connect Railway account
# 3. Create new project
# 4. Link GitHub repository
# 5. Add MongoDB plugin
# 6. Set variables and deploy
```

#### Option 3: AWS EC2

```bash
# 1. Create EC2 instance (Node.js AMI)
# 2. SSH into instance
# 3. Clone repository
# 4. Install Node.js and npm
# 5. npm install
# 6. Set .env variables
# 7. Use PM2 for process management
#    npm install -g pm2
#    pm2 start src/server.js --name "e2e-backend"
# 8. Configure security groups
```

### Frontend Deployment

#### Option 1: Vercel (Recommended)

```bash
# 1. Push to GitHub
# 2. Import project in Vercel
# 3. Set Environment Variables:
VITE_API_BASE_URL=https://your-backend-api.com/api

# 4. Deploy automatically on every push
```

#### Option 2: Netlify

```bash
# 1. Push to GitHub
# 2. Connect to Netlify
# 3. Build command: npm run build
# 4. Publish directory: dist
# 5. Set environment variables
# 6. Deploy
```

#### Option 3: GitHub Pages

```bash
# Not recommended for sensitive apps
# Use Vercel or Netlify instead
```

## Testing

### Manual Testing Checklist

- [ ] User registration works
- [ ] Login persists token
- [ ] File upload encrypts properly
- [ ] Download decrypts file correctly
- [ ] File sharing generates token
- [ ] Shared file download works with password
- [ ] Wrong password fails gracefully
- [ ] File deletion works
- [ ] Logout clears session
- [ ] Console shows encryption logs

### Test Commands

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Encryption

1. Upload a file
2. Open DevTools (F12)
3. Check Console for:
   - File encrypted successfully
   - Key stored in sessionStorage
4. Download file
5. Check Console for:
   - File decrypted successfully

### Test File Tampering

1. Upload a file (note the file ID)
2. Use MongoDB client to modify encrypted file
3. Try to download
4. Should get error: "File integrity compromised"

## Important Security Notes

### DO

- Use HTTPS in production
- Keep JWT_SECRET strong and random
- Store sensitive env vars in `.env` files
- Use rate limiting
- Validate all inputs
- Monitor error logs
- Update dependencies regularly
- Use strong passwords

### DON'T

- Don't commit `.env` files
- Don't expose JWT_SECRET in code
- Don't store keys in localStorage
- Don't trust client-side only
- Don't use HTTP in production
- Don't log sensitive data
- Don't skip input validation

## Troubleshooting

### Backend Won't Start

```bash
# Check Node version
node --version  # Should be 18+

# Check MongoDB connection
# Edit .env and test MONGO_URI

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Start with debug output
DEBUG=* npm run dev
```

### Frontend Won't Connect

```bash
# Check API URL in .env.local
# Should be: http://localhost:5000/api

# Verify backend is running
curl http://localhost:5000/health

# Check CORS settings in backend
# Should allow http://localhost:5173
```

### Encryption Fails

```bash
# Check browser console (F12)
# Look for Web Crypto API errors

# Verify HTTPS (production)
# Encryption requires secure context

# Try in incognito window
# No extensions to interfere
```

## Documentation

- [Backend README](backend/README.md) - API, database, deployment
- [Frontend README](frontend/README.md) - UI, encryption, components

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - See LICENSE file for details

## Legal Disclaimer

This software is provided "as-is". Users are responsible for:

- Complying with local encryption laws
- Securing their credentials
- Regular backups
- Testing in their environment

## 🔗 Useful Links

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Render Hosting](https://render.com)
- [Vercel Hosting](https://vercel.com)
- [Express.js](https://expressjs.com)
- [React](https://react.dev)

## 💬 Support

For issues or questions:

1. Check the README files
2. Review console logs
3. Check backend error logs
4. Search existing issues

## 🎉 Features Implemented

- ✅ User authentication (Register/Login)
- ✅ File upload with client-side encryption
- ✅ File download with client-side decryption
- ✅ File sharing with password protection
- ✅ Encrypted file storage on server
- ✅ JWT-based authentication
- ✅ Rate limiting
- ✅ CORS support
- ✅ Error handling
- ✅ Responsive UI
- ✅ SessionStorage key management
- ✅ File expiration for shared links
- ✅ Comprehensive logging
- ✅ Production-ready code

## 🚀 Future Enhancements

- [ ] 2FA authentication
- [ ] File versioning
- [ ] Batch uploads
- [ ] File preview (encrypted)
- [ ] Advanced sharing permissions
- [ ] Download history
- [ ] API key authentication
- [ ] WebSocket real-time updates
- [ ] Blockchain integration (optional)
- [ ] Mobile apps (React Native)

---

**🔐 Built with Security First**

Last Updated: April 2026
Version: 1.0.0
