# 🔐 End-to-End Encrypted File Sharing System - Frontend

A production-ready React frontend for secure file sharing using **AES-256-GCM encryption** in the browser. Files are encrypted before upload and keys never leave your device.

## ✨ Key Features

- **Client-Side AES-256-GCM Encryption**: Files encrypted before upload
- **PBKDF2 Key Derivation**: Secure password-based encryption for shared files
- **SessionStorage Key Management**: Keys cleared when tab closes
- **Secure File Sharing**: Password-protected shareable links
- **Responsive UI**: Works on desktop and mobile
- **Real-time Encryption Logs**: See encryption/decryption process
- **Automatic File Expiration**: Set share link expiration

## 📋 Requirements

- Node.js 18+
- npm or yarn
- Modern browser with Web Crypto API support

## 🚀 Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Outputs to `dist/` directory

## 🔐 Encryption in Browser

### AES-256-GCM Encryption

```javascript
// Generate key and IV
const key = await generateAESKey(); // 256-bit key
const iv = generateIV(); // 12-byte random IV

// Encrypt file
const encryptedData = await encryptFile(file, key, iv);

// Extract auth tag (last 16 bytes)
const authTag = encryptedData.slice(-16);

// Upload encrypted data + IV + authTag
```

### PBKDF2 Key Derivation

```javascript
// For shared files with password
const salt = generateSalt(); // 16-byte random salt
const key = await deriveKeyFromPassword(password, salt);

// Uses 100,000 iterations for security
```

### Key Storage

```javascript
// Store in sessionStorage (cleared when tab closes)
storeKey(fileId, encryptedKey);

// Retrieve when downloading
const key = retrieveKey(fileId);

// Delete explicitly
deleteKey(fileId);
```

## 📱 User Interface

### Dashboard

- **File List**: All your encrypted files
- **Upload Section**: Drag & drop file upload
- **Download Button**: Decrypt and download files
- **Share Button**: Generate password-protected share links
- **Delete Button**: Remove files permanently
- **User Profile**: Logout button

### Authentication

- **Register**: Create new account
- **Login**: Access your files

### Shared File View

- **File Info**: Name, size, upload date, expiration
- **Password Entry**: Enter password to decrypt
- **Download**: Download and decrypt shared file

## 🎯 Workflows

### Upload & Encrypt

```
1. Select file from computer
2. Frontend generates AES-256 key
3. Frontend generates random IV
4. Frontend encrypts file with AES-GCM
5. Frontend stores key in sessionStorage
6. Frontend uploads encrypted file + IV + authTag
7. Backend stores encrypted data
8. File ready to download
```

### Download & Decrypt

```
1. Click download on file
2. Frontend retrieves key from sessionStorage
3. Frontend downloads encrypted file
4. Frontend decrypts using AES-256-GCM
5. Frontend verifies authentication tag
6. Browser triggers download
7. File saved to computer
```

### Share with Password

```
1. Click share on file
2. Enter password for recipient
3. Set expiration (optional)
4. Frontend generates PBKDF2 salt
5. Backend generates share token
6. Share link copied to clipboard
7. Share password separately
8. Recipient can decrypt with password
```

## 🔑 Key Management

### Owner's Files

- **Key Generation**: Random AES-256 key per file
- **Key Storage**: SessionStorage (cleared on tab close)
- **Key Access**: Only available in same session
- **Key Loss**: Irreversible if sessionStorage cleared

### Shared Files

- **Key Derivation**: From password using PBKDF2
- **Key Storage**: Only in memory during decryption
- **Key Recovery**: Recalculate from password anytime
- **Password**: Shared separately, never sent to server

## 📊 Component Structure

```
src/
├── components/
│   ├── FileUpload.jsx (Upload & encrypt)
│   ├── FileList.jsx (List & manage files)
│   └── UserProfile.jsx (User info & logout)
├── pages/
│   ├── Register.jsx (Registration)
│   ├── Login.jsx (Login)
│   ├── Dashboard.jsx (Main dashboard)
│   └── SharedFile.jsx (Shared file view)
├── services/
│   └── api.js (API client & auth)
├── utils/
│   ├── encryption.js (Web Crypto API)
│   └── storage.js (SessionStorage management)
├── styles/
│   ├── Auth.css
│   ├── Dashboard.css
│   ├── Components.css
│   └── SharedFile.css
├── App.jsx (Router)
└── main.jsx (Entry point)
```

## 🚀 Deployment

### Deploy on Vercel

1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables:
   ```
   VITE_API_BASE_URL=https://your-backend-api.com/api
   ```
4. Deploy

### Deploy on Netlify

1. Push code to GitHub
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set environment variables
6. Deploy

### Deploy on GitHub Pages

```bash
# Not recommended for sensitive apps
# Use Vercel or Netlify instead
```

## 🔒 Security Considerations

### ✅ What's Secure

- Files encrypted before upload
- Encryption keys never sent to server
- HTTPS only (configure in production)
- Passwords never stored
- SessionStorage auto-clears on browser close
- Strong key derivation (100,000 iterations)

### ⚠️ Important Notes

- **Browser Security**: Only secure with HTTPS
- **Session Storage**: Cleared when tab closes
- **Password**: Recipient must protect password
- **Share Links**: Do not share publicly
- **Server Trust**: Backend can still see metadata

### 🚫 What's NOT Encrypted

- Filename (stored on server)
- File size (stored on server)
- Upload timestamp (stored on server)
- Sharing metadata (stored on server)

## 🧪 Testing

### Test Encryption

1. Upload a file
2. Open DevTools Console
3. See "✅ File encrypted successfully" message
4. Download file
5. See "✅ File decrypted successfully" message

### Test File Tampering

1. Upload a file
2. Try to modify encrypted file on server
3. Download and attempt to decrypt
4. Should see "File integrity compromised" error

### Test Shared Files

1. Upload a file
2. Click "Share"
3. Enter password and copy share link
4. Open link in incognito window
5. Enter password to download
6. File should decrypt correctly

### Test Session Storage

1. Upload a file
2. Close browser tab
3. Reopen dashboard
4. Try to download the file
5. Should see "No key in sessionStorage" error

## 🐛 Troubleshooting

### "File integrity compromised"

- File was tampered with
- Wrong encryption key
- IV or authTag corrupted
- Try re-uploading

### "Encryption key not found"

- Browser session cleared
- SessionStorage disabled
- Tab was closed
- Try re-uploading

### "Wrong password"

- Incorrect password entered
- File was corrupted
- Try re-entering password carefully

### Upload Fails

- File too large (>100MB default)
- Network error
- Browser storage full
- Check console for details

### Web Crypto API Not Available

- Use modern browser (Chrome, Firefox, Safari, Edge)
- Enable JavaScript
- Use HTTPS
- Not supported in older browsers

## 📚 Browser Support

| Browser     | Support | Notes             |
| ----------- | ------- | ----------------- |
| Chrome 37+  | ✅      | Full support      |
| Firefox 34+ | ✅      | Full support      |
| Safari 11+  | ✅      | Full support      |
| Edge 79+    | ✅      | Full support      |
| Opera 24+   | ✅      | Full support      |
| IE          | ❌      | No Web Crypto API |

## 🔧 Configuration

### Maximum File Size

Edit `.env.local`:

```env
VITE_MAX_FILE_SIZE=104857600  # 100MB in bytes
```

### API Endpoint

```env
VITE_API_BASE_URL=https://api.example.com/api
```

## 📝 Console Logging

Watch the browser console for encryption operations:

```
✅ Generating AES-256 key...
✅ File encrypted successfully with AES-256-GCM
  IV: [base64 string]
  Ciphertext size: 1024000 bytes
📤 Uploading encrypted file...
✅ Upload complete
🔑 Key stored in sessionStorage
```

## 🎨 Customization

### Colors

Edit CSS files:

```css
/* Primary color */
--primary: #667eea;

/* Secondary color */
--secondary: #764ba2;
```

### Upload Size Limit

```javascript
// In vite.config.js
export default defineConfig({
  server: {
    maxRequestBodySize: 104857600, // 100MB
  },
});
```

## 📄 License

MIT

---

**🔐 Remember**: This frontend provides client-side encryption. Always use HTTPS in production!
