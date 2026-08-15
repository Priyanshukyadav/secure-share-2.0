# 🧪 Testing Guide

Comprehensive testing guide for the End-to-End Encrypted File Sharing System.

## Test Environment Setup

### Prerequisites

- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- MongoDB Atlas connected
- Browser DevTools enabled (F12)

### Console Logging

All encryption/decryption operations log to browser console. Watch for:

```
✅ Generating AES-256 key...
✅ File encrypted successfully with AES-256-GCM
📤 Uploading encrypted file...
✅ Key stored in sessionStorage
```

---

## 🧑‍💼 User Registration & Login

### Test 1: Register New User

**Steps:**

1. Click "Create Account"
2. Fill in form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "Test123!"
   - Confirm: "Test123!"
3. Click "Create Account"

**Expected Result:**

- ✅ User created
- ✅ Logged in automatically
- ✅ Redirected to dashboard
- ✅ Token stored in localStorage

### Test 2: Login with Credentials

**Steps:**

1. Logout
2. Click "Login here"
3. Enter:
   - Email: "test@example.com"
   - Password: "Test123!"
4. Click "Login"

**Expected Result:**

- ✅ Login successful
- ✅ Token retrieved
- ✅ User info displayed

### Test 3: Invalid Credentials

**Steps:**

1. Try login with wrong password
2. Try login with non-existent email

**Expected Result:**

- ✅ Error message shown
- ✅ Not logged in
- ✅ Redirected to login

### Test 4: Duplicate Email

**Steps:**

1. Try to register with existing email

**Expected Result:**

- ✅ Error: "User already exists"
- ✅ Registration fails

---

## 📤 File Upload & Encryption

### Test 5: Upload Small File

**Steps:**

1. Dashboard → Upload section
2. Click file input
3. Select small file (< 1MB)
4. Click "Upload & Encrypt"

**Expected Result:**

- ✅ Console shows "Generating AES-256 key"
- ✅ Console shows "File encrypted successfully"
- ✅ Upload progress bar appears
- ✅ Upload completes
- ✅ File appears in file list

**Verify Encryption:**

```javascript
// In console
sessionStorage.getItem("e2e_key_<fileId>");
// Should show base64 encoded key
```

### Test 6: Upload Medium File (10-50 MB)

**Steps:**

1. Upload medium sized file

**Expected Result:**

- ✅ Encryption takes a few seconds
- ✅ Progress bar shows actual progress
- ✅ File appears in list with correct size

### Test 7: Upload Large File (100 MB)

**Steps:**

1. Upload 100MB file
2. Wait for encryption

**Expected Result:**

- ✅ Encryption completes (might take 30-60 seconds)
- ✅ File metadata shows correct size
- ✅ Backend receives encrypted data correctly

### Test 8: Upload Maximum File Size

**Steps:**

1. Create file > 100MB
2. Try to upload

**Expected Result:**

- ✅ Error shown: "File size exceeds limit"
- ✅ Upload blocked

### Test 9: Upload Multiple Files

**Steps:**

1. Upload 3 different files
2. Wait for each to complete

**Expected Result:**

- ✅ Each file has unique key in sessionStorage
- ✅ Each file appears in list
- ✅ File list shows all 3 files

---

## ⬇️ File Download & Decryption

### Test 10: Download Encrypted File

**Steps:**

1. Upload a test file
2. Click "Download" button
3. Wait for decryption

**Expected Result:**

- ✅ Console shows "Retrieving key from sessionStorage"
- ✅ Console shows "Decrypting file"
- ✅ Console shows "File decrypted successfully"
- ✅ File downloads to computer
- ✅ Downloaded file matches original

**Verify Decryption:**

```javascript
// Before download
sessionStorage.getItem("e2e_key_<fileId>");
// Should show stored key being used
```

### Test 11: Download Multiple Files

**Steps:**

1. Upload 3 different files
2. Download each in sequence

**Expected Result:**

- ✅ Each decrypts with correct key
- ✅ All files match originals
- ✅ Each has separate encryption key

### Test 12: Missing Encryption Key

**Steps:**

1. Upload file
2. Open DevTools → Application → SessionStorage
3. Delete the `e2e_key_*` entry
4. Try to download file

**Expected Result:**

- ✅ Error shown: "Encryption key not found"
- ✅ Decryption blocked
- ✅ File not downloaded

### Test 13: Verify Encryption Integrity

**Steps:**

1. Upload file
2. Open MongoDB Atlas
3. Find encrypted file in database
4. Manually modify encrypted data
5. Try to download

**Expected Result:**

- ✅ Console shows decryption error
- ✅ Error message: "File integrity compromised"
- ✅ Authentication tag verification fails
- ✅ File not decrypted

---

## 🔗 File Sharing & Password Protection

### Test 14: Generate Share Link

**Steps:**

1. Upload file
2. Click "Share"
3. Enter password: "SharePass123!"
4. Set expiration: 24 hours
5. Click "Generate Share Link"

**Expected Result:**

- ✅ Share link generated
- ✅ Link copied to clipboard
- ✅ Message shows: "Share link copied"
- ✅ Link format: `http://localhost:5173/shared/<token>`

### Test 15: Access Shared File with Correct Password

**Steps:**

1. Open shared link in new tab
2. See file info
3. Enter password: "SharePass123!"
4. Click "Download & Decrypt"

**Expected Result:**

- ✅ File info displayed
- ✅ Password field visible
- ✅ Console shows PBKDF2 key derivation
- ✅ Console shows decryption with derived key
- ✅ File downloads correctly

### Test 16: Access Shared File with Wrong Password

**Steps:**

1. Open shared link in new tab
2. Enter wrong password: "WrongPass123!"
3. Click "Download & Decrypt"

**Expected Result:**

- ✅ Console shows key derivation (different key)
- ✅ Console shows decryption error
- ✅ Error message: "File integrity compromised"
- ✅ File not downloaded

### Test 17: Access Expired Shared Link

**Steps:**

1. Share file with 1 hour expiration
2. Wait (or manually modify expiration in MongoDB)
3. Try to access link

**Expected Result:**

- ✅ Error: "Shared file has expired"
- ✅ File not accessible
- ✅ Download blocked

### Test 18: Multiple Share Links for Same File

**Steps:**

1. Upload file
2. Generate 2 different share links with different passwords
3. Test both links

**Expected Result:**

- ✅ Both links work
- ✅ Each requires correct password
- ✅ Same encrypted file, different passwords

---

## 🔒 SessionStorage Key Management

### Test 19: Key Persistence Within Session

**Steps:**

1. Upload file A
2. Close file list panel
3. Reopen file list
4. Download file A

**Expected Result:**

- ✅ Key still in sessionStorage
- ✅ Download works
- ✅ File decrypts correctly

### Test 20: Key Loss on Tab Close

**Steps:**

1. Upload file
2. Close browser tab
3. Reopen application
4. Try to download file

**Expected Result:**

- ✅ New tab has empty sessionStorage
- ✅ Error: "Encryption key not found"
- ✅ Download fails (expected behavior)

### Test 21: Key Not Shared Between Tabs

**Steps:**

1. Upload file in Tab 1
2. Open dashboard in Tab 2
3. Try to download file in Tab 2

**Expected Result:**

- ✅ Tab 2 has different sessionStorage
- ✅ Key not visible in Tab 2
- ✅ Error: "Encryption key not found"
- ✅ Download fails

### Test 22: Clear SessionStorage

**Steps:**

1. Upload file
2. Open DevTools → Console
3. Run: `sessionStorage.clear()`
4. Try to download file

**Expected Result:**

- ✅ Error: "Encryption key not found"
- ✅ All keys cleared
- ✅ No files downloadable

---

## 🚨 Error Handling

### Test 23: Network Error During Upload

**Steps:**

1. Close backend server
2. Try to upload file

**Expected Result:**

- ✅ Upload fails after timeout
- ✅ Error message shown
- ✅ File not stored
- ✅ Key not stored

### Test 24: Network Error During Download

**Steps:**

1. Close backend server
2. Try to download file

**Expected Result:**

- ✅ Download fails
- ✅ Error shown
- ✅ File not corrupted

### Test 25: Invalid JWT Token

**Steps:**

1. Login
2. Open DevTools → Application
3. Modify auth_token in localStorage
4. Try to access dashboard

**Expected Result:**

- ✅ Error: "Invalid token"
- ✅ Redirect to login
- ✅ Session cleared

### Test 26: Expired JWT Token

**Steps:**

1. Wait for JWT to expire (7 days default)
2. Try to use app

**Expected Result:**

- ✅ Error: "Token expired"
- ✅ Redirect to login
- ✅ Force re-login

---

## 📊 File Metadata

### Test 27: File Metadata Display

**Steps:**

1. Upload file
2. Check file list

**Expected Result:**

- ✅ Filename shown correctly
- ✅ File size shown correctly
- ✅ Upload date shown correctly

### Test 28: File Deletion

**Steps:**

1. Upload file
2. Click delete button
3. Confirm deletion

**Expected Result:**

- ✅ File removed from database
- ✅ File removed from filesystem
- ✅ File removed from list
- ✅ Key removed from sessionStorage

---

## 🔐 Encryption Algorithm Verification

### Test 29: AES-256-GCM Parameters

**Steps:**

1. Upload file
2. Open DevTools → Console
3. Check console logs for encryption details

**Expected Result:**

- ✅ Logs show "AES-256-GCM"
- ✅ IV shown (12 bytes = 16 chars base64)
- ✅ AuthTag shown (16 bytes = 24 chars base64)
- ✅ Key shown (256-bit = 32 bytes)

### Test 30: PBKDF2 Parameters

**Steps:**

1. Access shared file with password
2. Check console

**Expected Result:**

- ✅ Logs show "PBKDF2"
- ✅ Iterations: 100,000
- ✅ Hash: SHA-256
- ✅ Key derived from password

---

## 🧑‍💻 Developer/Debug Tests

### Test 31: Console Logging

**Steps:**

1. Upload file
2. Check browser console

**Expected Result:**

- ✅ See all encryption logs
- ✅ See API calls
- ✅ See errors clearly
- ✅ No sensitive data in logs

### Test 32: API Response Headers

**Steps:**

1. Download file
2. Open DevTools → Network tab
3. Click on download request

**Expected Result:**

- ✅ Response headers show: `X-Encryption-IV`
- ✅ Response headers show: `X-Encryption-Auth-Tag`
- ✅ Response headers show: `X-File-Size`
- ✅ Content-Type: `application/octet-stream`

### Test 33: Request Payload

**Steps:**

1. Upload file
2. Open DevTools → Network tab
3. Check upload request

**Expected Result:**

- ✅ Form data shows: `file` (binary)
- ✅ Form data shows: `iv` (base64)
- ✅ Form data shows: `authTag` (base64)
- ✅ Form data shows: `originalName` (string)

### Test 34: Database Records

**Steps:**

1. Upload file
2. Check MongoDB Atlas

**Expected Result:**

- ✅ User record created
- ✅ File metadata stored
- ✅ File has: filename, size, owner, iv, authTag
- ✅ No plaintext data
- ✅ No encryption keys in database

---

## 🎯 Security Tests

### Test 35: XSS Protection

**Steps:**

1. Try uploading file with name: `<script>alert('xss')</script>`
2. Check if script executes

**Expected Result:**

- ✅ Filename treated as plain text
- ✅ Script tag displayed, not executed
- ✅ No XSS vulnerability

### Test 36: CSRF Protection

**Steps:**

1. Check requests for CSRF tokens
2. Verify Origin/Referer headers

**Expected Result:**

- ✅ API validates same-origin
- ✅ CORS properly configured
- ✅ Frontend origin matches backend

### Test 37: Rate Limiting

**Steps:**

1. Make 6 login requests in 1 minute

**Expected Result:**

- ✅ 5th request succeeds
- ✅ 6th request fails
- ✅ Error: "Too many requests"

---

## 📱 Cross-Browser Tests

### Test 38: Chrome/Chromium

- [ ] Register/Login works
- [ ] File upload encrypts
- [ ] File download decrypts
- [ ] Sharing works

### Test 39: Firefox

- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable

### Test 40: Safari

- [ ] All features work
- [ ] Web Crypto API supported
- [ ] No compatibility issues

### Test 41: Edge

- [ ] All features work
- [ ] Encryption/decryption works
- [ ] Responsive design works

---

## 📝 Performance Tests

### Test 42: Large File Encryption

**Steps:**

1. Upload 100MB file
2. Time the encryption

**Expected Result:**

- ✅ Encryption completes in < 60 seconds
- ✅ Progress shown to user
- ✅ No UI freezes

### Test 43: Large File Decryption

**Steps:**

1. Download 100MB file
2. Time the decryption

**Expected Result:**

- ✅ Decryption completes in < 60 seconds
- ✅ File downloads correctly
- ✅ No data loss

### Test 44: Many Small Files

**Steps:**

1. Upload 100 small files
2. Download all

**Expected Result:**

- ✅ All files upload successfully
- ✅ All files have unique keys
- ✅ All files download correctly

---

## ✅ Final Verification Checklist

- [ ] User auth works (register, login, logout)
- [ ] File upload with encryption works
- [ ] File download with decryption works
- [ ] File sharing with password works
- [ ] Wrong password fails gracefully
- [ ] Encryption keys stored securely
- [ ] Database contains only encrypted data
- [ ] API returns proper error messages
- [ ] Rate limiting works
- [ ] CORS properly configured
- [ ] No console errors
- [ ] No sensitive data in logs
- [ ] Performance acceptable
- [ ] UI responsive on mobile
- [ ] Accessibility improved

---

## 📊 Test Results Template

```markdown
## Test Run: [Date]

### Registration & Auth

- [ ] Test 1: Register user - PASS/FAIL
- [ ] Test 2: Login - PASS/FAIL
- [ ] Test 3: Invalid credentials - PASS/FAIL
- [ ] Test 4: Duplicate email - PASS/FAIL

### Upload & Encryption

- [ ] Test 5: Upload small file - PASS/FAIL
- [ ] Test 6: Upload medium file - PASS/FAIL
- [ ] Test 7: Upload large file - PASS/FAIL
- [ ] Test 8: Upload over limit - PASS/FAIL
- [ ] Test 9: Multiple files - PASS/FAIL

### Download & Decryption

- [ ] Test 10: Download file - PASS/FAIL
- [ ] Test 11: Multiple downloads - PASS/FAIL
- [ ] Test 12: Missing key - PASS/FAIL
- [ ] Test 13: Tampered file - PASS/FAIL

### Sharing

- [ ] Test 14: Generate share link - PASS/FAIL
- [ ] Test 15: Correct password - PASS/FAIL
- [ ] Test 16: Wrong password - PASS/FAIL
- [ ] Test 17: Expired link - PASS/FAIL
- [ ] Test 18: Multiple shares - PASS/FAIL

### Session Storage

- [ ] Test 19: Key persistence - PASS/FAIL
- [ ] Test 20: Key loss on close - PASS/FAIL
- [ ] Test 21: Not shared between tabs - PASS/FAIL
- [ ] Test 22: Clear storage - PASS/FAIL

### Error Handling

- [ ] Test 23: Network error upload - PASS/FAIL
- [ ] Test 24: Network error download - PASS/FAIL
- [ ] Test 25: Invalid token - PASS/FAIL
- [ ] Test 26: Expired token - PASS/FAIL

### Encryption Verification

- [ ] Test 29: AES-256-GCM params - PASS/FAIL
- [ ] Test 30: PBKDF2 params - PASS/FAIL

### Security

- [ ] Test 35: XSS protection - PASS/FAIL
- [ ] Test 36: CSRF protection - PASS/FAIL
- [ ] Test 37: Rate limiting - PASS/FAIL

### Browsers

- [ ] Chrome - PASS/FAIL
- [ ] Firefox - PASS/FAIL
- [ ] Safari - PASS/FAIL
- [ ] Edge - PASS/FAIL

### Performance

- [ ] Test 42: 100MB encryption - PASS/FAIL
- [ ] Test 43: 100MB decryption - PASS/FAIL
- [ ] Test 44: Many small files - PASS/FAIL

### Overall

- [ ] No critical issues
- [ ] No data loss
- [ ] Good performance
- [ ] Ready for production

**Tested By:** [Name]
**Date:** [Date]
**Notes:** [Any observations]
```

---

**🎉 All tests passed? Your system is ready for deployment!**

---

Last Updated: April 2026
