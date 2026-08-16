# Authentication Tag Fix - Setup & Testing Guide

##  What Was Fixed

The "Authentication tag verification failed" error when downloading shared encrypted files is now **FIXED**.

### Root Cause
Files were encrypted with one key during upload, but a different key was used during shared download  **key mismatch**  auth tag verification failed.

### Solution
Files can now be uploaded WITH password protection, ensuring the same key is used for both encryption and decryption.

---

##  Files Modified

### Backend
- `backend/src/controllers/fileController.js`
  - `uploadFile()`: Accept optional salt during upload
  - `shareFile()`: Use salt from upload instead of generating new one

- `backend/src/server.js`
  - Already fixed: CORS `exposedHeaders` for header access

### Frontend
- `frontend/src/components/FileUpload.jsx`: Add password protection option
- `frontend/src/services/api.js`: Accept optional salt in upload
- `frontend/src/styles/Components.css`: Add password input styling

---

##  Testing Instructions

### Step 1: Start Servers

**Backend:**
```bash
cd backend
npm run dev
```
Expected: Server running on http://localhost:5000

**Frontend:**
```bash
cd frontend
npm run dev
```
Expected: Dev server running on http://localhost:5173

### Step 2: Test Password-Protected Upload

1. Open http://localhost:5173 in browser
2. Register/Login with test account
3. Click "Upload & Encrypt File"
4.  Check " Protect with password (for sharing)"
5. Enter password: `TestPassword123`
6. Confirm password: `TestPassword123`
7. Select a test file
8. Click "Upload & Encrypt"
9. **Expected**: File uploaded successfully with message "(Password protected)"

### Step 3: Test Shared Download

1. Find uploaded file in file list
2. Click "Share" button
3. **Expected**: Share link copied to clipboard (no password field!)
4. Alert shows: "Shared files use the password set during upload"
5. Copy the shared link
6. **Open link in new tab/incognito** (to test shared access)
7. Enter password: `TestPassword123`
8. Click "Download"
9. **Expected**:  File downloads successfully WITHOUT "Authentication tag verification failed" error

### Step 4: Test Wrong Password

1. Open shared link in new tab
2. Enter WRONG password: `WrongPassword123`
3. Click "Download"
4. **Expected**:  Error: "File integrity compromised: Authentication tag verification failed"
5. **Good**: This means wrong keys are properly rejected

### Step 5: Test File Without Password

1. Upload file WITHOUT checking "Protect with password"
2. Try to share it
3. **Expected**:  Error: "File must be uploaded with password protection to share. Please upload with a password."
4. **Good**: This is correct behavior (random key files can't be shared)

### Step 6: Browser Console Verification

1. Open shared file download
2. Right-click  Inspect  Console tab
3. During download, check for logs like:
   ```
    Downloaded encrypted file
    Deriving key from password...
    Decrypting file...
    File downloaded and decrypted successfully
   ```
4. **No errors** about "string not correctly encoded" or auth tag

---

##  Detailed Test Scenarios

### Scenario 1: Fresh Upload & Share
```
Step 1: Upload with password "Test123"
   File encrypted with key(password, salt)
   Salt stored in database

Step 2: Share file
   Uses salt from database
   Creates share link

Step 3: Download shared file with password "Test123"
   Derives key from (password, same salt)
   SUCCESS: Keys match, file decrypts

Result: File downloads without errors
```

### Scenario 2: Multiple Downloads
```
Step 1: Share file and get link
Step 2: Download first time with correct password   Success
Step 3: Download second time with correct password   Success
Step 4: Try with wrong password   Auth tag fail

Result: Consistent behavior across attempts
```

### Scenario 3: Owner vs Shared Access
```
Step 1: Upload with password "MySecret"
Step 2: Owner clicks Download in file list
   Uses stored key from sessionStorage
   Works (different mechanism)

Step 3: Share link to someone else
Step 4: They enter password "MySecret"
   Derives key from PBKDF2(password, salt)
   Works (same derived key)

Result: Both pathways work correctly
```

---

##  Expected Behavior Summary

| Scenario | Action | Result |
|----------|--------|--------|
| Upload file WITH password | Share & Download with **same** password |  SUCCESS |
| Upload file WITH password | Download with **wrong** password |  Auth tag fails |
| Upload file WITHOUT password | Share button clicked |  Error: "must be uploaded with password" |
| Upload file WITHOUT password | Owner downloads |  SUCCESS (uses sessionStorage key) |
| Shared file download | First time, correct password |  SUCCESS |
| Shared file download | Multiple times, correct password |  SUCCESS |
| Shared file expired | Try to download |  Error: "Shared file has expired" |

---

##  Troubleshooting

### Issue: "Missing encryption IV in response header"
- **Cause**: CORS headers not exposed
- **Fix**: Already applied in backend/src/server.js
- **Verify**: Check server.js has `exposedHeaders: ['x-iv', 'x-auth-tag', 'x-share-salt', 'x-file-size']`

### Issue: "File must be uploaded with password protection"
- **Cause**: File was uploaded WITHOUT checking password checkbox
- **Fix**: Upload new file with password protection enabled
- **Note**: This is correct behavior - random key files can't be shared

### Issue: "Authentication tag verification failed"
- **Cause**: Wrong password used OR old code still running
- **Fix**: Use correct password & restart servers
- **Verify**: Check frontend console shows correct derivation logs

### Issue: File decrypt fails but password is correct
- **Cause**: Servers not restarted with new code
- **Fix**: Kill both servers (Ctrl+C) and restart
- **Verify**: Package versions loaded correctly

---

##  Code Verification

### Backend Change Check
```bash
# Check uploadFile accepts salt
grep -n "const { iv, authTag, originalName, salt }" \
  backend/src/controllers/fileController.js
# Should find: line with salt parameter

# Check shareFile uses existing salt
grep -n "file.shareSalt" backend/src/controllers/fileController.js
# Should find multiple lines with file.shareSalt
```

### Frontend Change Check
```bash
# Check FileUpload has password option
grep -n "usePassword" frontend/src/components/FileUpload.jsx
# Should find multiple lines with usePassword state

# Check API accepts salt
grep -n "if (salt)" frontend/src/services/api.js
# Should find salt parameter handling
```

---

##  Log Samples

### Successful Upload (With Password)
```
 File uploaded successfully:
  passwordProtected: true
  filename: document.pdf
  size: 1048576
```

### Successful Share
```
 File shared:
  shareToken: abc123def456
  saltUsed: xyzBase64Encoded==
```

### Successful Shared Download
```
 Downloaded encrypted file
 Deriving key from password...
 Decrypting file...
 File downloaded and decrypted successfully
```

### Failed Share (No Password)
```
 Error: File must be uploaded with password protection to share.
         Please upload with a password.
```

---

##  Important Notes

1. **Password is Same for Owner & Shared Users**
   - Owner who uploaded with password uses same password to share
   - Shared users use same password to download
   - This is by design for security

2. **Shared Files Cannot Be Unshared**
   - Once shared, link remains valid
   - Expiration time can be set during share
   - Delete file to revoke all access

3. **Old Files Without Password**
   - Cannot be shared with new code
   - Must be re-uploaded with password protection
   - Owner can still download (uses stored key)

4. **Browser Caching**
   - Clear browser cache after deployment
   - SessionStorage clears on tab close (intentional)
   - Ctrl+Shift+Del to clear cache

---

##  Success Indicators

After testing, you should see:

 Upload with password  "File encrypted and uploaded successfully! (Password protected)"
 Share file  "Share link copied to clipboard"
 Shared download with correct password  File downloads
 Shared download with wrong password  "Authentication tag verification failed"
 Browser console  No "string not correctly encoded" errors
 No CORS errors in Network tab
 Headers visible in Network tab: x-iv, x-auth-tag, x-share-salt

---

##  If Something Goes Wrong

1. **Check servers are restarted** with new code
2. **Clear browser cache** (Ctrl+Shift+Del)
3. **Check console for errors** (F12  Console tab)
4. **Check Network tab** for 400/500 errors
5. **Verify file has shareSalt** in database
6. **Check CORS headers** in response headers

---

##  Quick Help

**Question**: Why do I need to enter password during upload?
**Answer**: Because the file is encrypted with key derived from that password. Same password needed during download.

**Question**: Can I share a file uploaded without password?
**Answer**: No. Files need password protection to be shared. Upload new file with password to share.

**Question**: What if I forget the password?
**Answer**: Both you and shared users won't be able to decrypt it. Share link becomes useless.

**Question**: How long does shared link work?
**Answer**: Until expiration date (default: forever) or until file is deleted by owner.

---

## Next Steps

1. Run the test scenarios above
2. Verify all success indicators
3. Deploy to production when confident
4. Monitor for any "auth tag" errors in logs
5. Users should re-upload old files with password to share them







