#  Quick Start Guide

Get your End-to-End Encrypted File Sharing System running in 5 minutes!

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- MongoDB Atlas account ([Free sign up](https://mongodb.com/cloud/atlas))
- Git

##  5-Minute Setup

### Step 1: MongoDB Setup (2 minutes)

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up (free tier available)
3. Create cluster (M0 free tier)
4. Get connection string:
   - Click "Connect"
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` and database name

Example:

```
mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/e2e-file-sharing?retryWrites=true&w=majority
```

### Step 2: Backend Setup (1.5 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env (use any text editor)
# Add your MongoDB URI
# Generate JWT_SECRET:
#   Linux/Mac: openssl rand -base64 32
#   Windows: Use online generator

# Start backend
npm run dev
```

 Backend running at `http://localhost:5000`

### Step 3: Frontend Setup (1 minute)

**In a new terminal:**

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Start frontend
npm run dev
```

 Frontend running at `http://localhost:5173`

### Step 4: Test (30 seconds)

1. Open browser to `http://localhost:5173`
2. Register new account
3. Upload a file
4. Download it to verify encryption/decryption
5. Test share feature

** Done!**

---

##  What Just Happened?

```
Your Computer
 Frontend (React) - http://localhost:5173
    Encrypts files with AES-256-GCM
    Stores key in sessionStorage
    Sends encrypted data to backend

 Backend (Express) - http://localhost:5000
    Receives encrypted data
    Stores in filesystem & metadata in MongoDB
    Never decrypts anything

 Database (MongoDB Atlas) - Cloud
     Stores encrypted files metadata
     Stores user info
     Stores share tokens
```

---

##  Common Issues

### Issue: Backend won't start

```bash
# Check Node version
node --version  # Should be 18+

# Check MongoDB connection
# Verify .env has correct MONGO_URI

# Reinstall
rm -rf node_modules
npm install
npm run dev
```

### Issue: Frontend can't connect to backend

```bash
# Verify backend is running
# Check that VITE_API_BASE_URL in .env.local matches backend URL
# Should be: http://localhost:5000/api

# Try opening: http://localhost:5000/health
```

### Issue: Encryption fails

```bash
# Check browser console (F12)
# Encryption requires HTTPS in production
# For development, should work on HTTP

# Try incognito window (no extensions)
```

---

##  Test Scenarios

### Test 1: Basic Upload/Download

1. Upload file
2. See console: " File encrypted successfully"
3. Download file
4. See console: " File decrypted successfully"
5. Verify file content matches original

### Test 2: File Sharing

1. Upload file
2. Click "Share"
3. Enter password
4. Copy share link
5. Open link in new tab
6. Enter password to download
7. Verify decryption works

### Test 3: Session Storage

1. Upload file
2. Note the file ID
3. Open browser DevTools (F12)
4. Go to Application  Session Storage
5. Search for "e2e*key*" + file ID
6. See base64 encoded key

### Test 4: Multi-Tab Test

1. Upload file in Tab 1
2. Open Tab 2 to same dashboard
3. Tab 2 can see file but key is in Tab 1's sessionStorage
4. Trying to download in Tab 2 shows "No key" error
5. This is correct behavior - key not shared between tabs

---

##  File Structure

```
e:\minorbanaobikaro
 backend/                 # Node.js + Express
    src/
       server.js       # Main entry point
       models/         # Database schemas
       controllers/    # Business logic
       routes/         # API endpoints
       utils/          # Helpers
    uploads/            # Encrypted files storage

 frontend/                # React + Vite
    src/
       pages/          # Page components
       components/     # UI components
       services/       # API client
       utils/          # Encryption logic
       styles/         # CSS files
       App.jsx         # Main component
    index.html          # Entry HTML

 README.md               # Project overview
```

---

##  Key Concepts

### AES-256-GCM

- **256-bit key**: Unbreakable encryption
- **12-byte IV**: Unique per file
- **16-byte auth tag**: Detect tampering
- **Client-side**: File encrypted before upload

### PBKDF2

- **100,000 iterations**: Slow on purpose (prevents brute force)
- **SHA-256**: Strong hashing
- **16-byte salt**: Random per share
- **Password  Key**: Derive encryption key from password

### SessionStorage

- **Cleared on tab close**: Keys don't persist
- **Not localStorage**: Safer, not sent in cookies
- **Per-tab**: Each tab has separate storage
- **Client-side only**: Never sent to server

---

##  Next Steps

1. **Explore the code**
   - See how encryption works in `frontend/src/utils/encryption.js`
   - Check API endpoints in `backend/src/routes/`

2. **Customize**
   - Change colors in `frontend/src/styles/`
   - Adjust file size limits in `.env`
   - Add your branding

3. **Deploy**
   - See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
   - Deploy backend on Render/Railway
   - Deploy frontend on Vercel/Netlify

4. **Scale**
   - Add more features
   - Monitor performance
   - Get user feedback

---

##  Learn More

- **Backend Details**: [backend/README.md](../backend/README.md)
- **Frontend Details**: [frontend/README.md](../frontend/README.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Main README**: [README.md](../README.md)

---

##  Security Notes

 **This is secure because:**

- Files are encrypted before upload
- Server never sees plaintext
- Encryption keys never sent to server
- Authentication tags prevent tampering
- Strong key derivation for passwords

 **For production:**

- Use HTTPS only (required for Web Crypto)
- Change JWT_SECRET to strong random value
- Use strong MongoDB password
- Enable rate limiting (already done)
- Monitor logs for attacks

---

##  Tips

1. **Large Files**: Encryption takes a few seconds for 100MB files
2. **Password Security**: Use strong passwords for shared files
3. **Browser Support**: Works on Chrome, Firefox, Safari, Edge (not IE)
4. **Offline**: Frontend works offline (can still decrypt cached files)
5. **Session Storage**: Clear manually if issues arise: `sessionStorage.clear()`

---

##  Features Ready to Use

 User Registration & Login
 File Upload with Encryption
 File Download with Decryption
 Password-Protected File Sharing
 File Expiration
 Rate Limiting
 Error Handling
 Responsive Mobile UI
 Real-time Encryption Logs

---

##  Help

1. Check the README files
2. Look at console logs (F12)
3. Check backend server logs
4. Try the troubleshooting section
5. Read the detailed documentation

---

**Happy Secure File Sharing! **

Questions? Check the detailed READMEs for more information!

Last Updated: April 2026







