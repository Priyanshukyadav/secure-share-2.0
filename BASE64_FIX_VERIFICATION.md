# Base64 Decoding Fix - Verification Guide

## Issue Fixed

**Problem:** "Failed to execute 'atob': The string to be decoded is not correctly encoded" error when downloading shared files.

**Root Cause:**

- Backend was using uppercase header names (`X-Encryption-IV`, etc.) which might not be transmitted correctly
- Frontend was reading lowercase header names with no error handling
- Base64 decoding function had no validation or error handling for edge cases

## Changes Made

### 1. Backend Changes (`backend/src/controllers/fileController.js`)

#### `downloadFile()` function (owner downloads)

- **Before:** Used `res.setHeader()` with uppercase names

  ```javascript
  res.setHeader("X-Encryption-IV", file.encryptionIv);
  res.setHeader("X-Encryption-Auth-Tag", file.encryptionAuthTag);
  res.setHeader("X-File-Size", file.size);
  ```

- **After:** Uses `res.set()` with lowercase names and explicit String conversion
  ```javascript
  res.set({
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="${file.originalName}"`,
    "x-iv": String(file.encryptionIv || ""),
    "x-auth-tag": String(file.encryptionAuthTag || ""),
    "x-file-size": String(file.size || 0),
  });
  ```

#### `downloadSharedFile()` function (shared file downloads)

- **Before:** Used `res.setHeader()` with uppercase names

  ```javascript
  res.setHeader("X-Encryption-IV", file.encryptionIv);
  res.setHeader("X-Encryption-Auth-Tag", file.encryptionAuthTag);
  res.setHeader("X-Share-Salt", file.shareSalt);
  res.setHeader("X-File-Size", file.size);
  ```

- **After:** Uses `res.set()` with lowercase names and explicit String conversion
  ```javascript
  res.set({
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="${file.originalName}"`,
    "x-iv": String(file.encryptionIv || ""),
    "x-auth-tag": String(file.encryptionAuthTag || ""),
    "x-share-salt": String(file.shareSalt || ""),
    "x-file-size": String(file.size || 0),
  });
  ```

**Why this works:**

- `res.set()` ensures consistent header handling
- Lowercase names match axios header normalization
- `String()` conversion prevents type coercion issues
- Fallback empty strings prevent undefined values

### 2. Frontend Changes

#### `frontend/src/utils/encryption.js` - `base64ToArrayBuffer()`

- **Before:** Direct `atob()` call with no error handling

  ```javascript
  export function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  ```

- **After:** Robust implementation with validation and error handling

  ```javascript
  export function base64ToArrayBuffer(base64) {
    if (!base64) {
      throw new Error("Base64 string is empty or undefined");
    }

    // Trim whitespace
    const trimmed = base64.trim();

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(trimmed)) {
      throw new Error("Invalid base64 format. Contains invalid characters.");
    }

    try {
      const binary = atob(trimmed);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      throw new Error(`Base64 decoding failed: ${error.message}`);
    }
  }
  ```

**Improvements:**

- Null/undefined check with clear error message
- Whitespace trimming (handles accidental spaces)
- Base64 format validation (prevents cryptic atob errors)
- Try-catch wrapper with context-specific error message

#### `frontend/src/pages/SharedFile.jsx` - `handleDownload()`

- **Before:** Direct header access with no error handling

  ```javascript
  const iv = base64ToArrayBuffer(response.headers["x-encryption-iv"]);
  const salt = base64ToArrayBuffer(response.headers["x-share-salt"]);
  ```

- **After:** Defensive header retrieval with detailed error handling

  ```javascript
  const ivHeader = response.headers["x-iv"];
  const saltHeader = response.headers["x-share-salt"];
  const authTagHeader = response.headers["x-auth-tag"];

  if (!ivHeader) {
    throw new Error(
      "Missing encryption IV in response header. Server may not have sent proper headers.",
    );
  }
  if (!saltHeader) {
    throw new Error(
      "Missing salt in response header. Server may not have sent proper headers.",
    );
  }

  // ... logging ...

  let iv, salt;
  try {
    iv = base64ToArrayBuffer(ivHeader.trim());
  } catch (err) {
    throw new Error(
      `Failed to decode IV: ${err.message}. IV value: ${ivHeader?.substring(0, 50)}`,
    );
  }

  try {
    salt = base64ToArrayBuffer(saltHeader.trim());
  } catch (err) {
    throw new Error(
      `Failed to decode salt: ${err.message}. Salt value: ${saltHeader?.substring(0, 50)}`,
    );
  }
  ```

**Improvements:**

- Explicit header existence checks
- Helpful error messages indicating server misconfiguration
- Safe Base64 decoding with specific error context
- Diagnostic logging showing header values (truncated for security)

#### `frontend/src/components/FileList.jsx` - `handleDownload()`

- Similar improvements to SharedFile.jsx
- Updated header names from `x-encryption-iv` to `x-iv`
- Added error handling for missing headers
- Safe Base64 decoding with try-catch

## Testing Verification Steps

### Test 1: Shared File Download

1. **Upload a file** as an authenticated user
2. **Share the file** with a password
3. **Open the shared link** in a new tab/browser
4. **Enter the password** and click Download
5. **Expected Result:** File downloads successfully without Base64 errors
6. **Verify:** File integrity by comparing downloaded file with original

### Test 2: Owner File Download

1. **Upload a file** as an authenticated user
2. **Verify encryption key** is stored in sessionStorage
3. **Click Download** on the file in the file list
4. **Expected Result:** File downloads successfully
5. **Verify:** File integrity by comparing downloaded file with original

### Test 3: Error Handling

1. **Manually test** Base64 decoding with:
   - Empty string: `base64ToArrayBuffer('')` → Error: "Base64 string is empty"
   - Invalid format: `base64ToArrayBuffer('!!!!')` → Error: "Invalid base64 format"
   - Malformed Base64: `base64ToArrayBuffer('abc')` → Error: "Base64 decoding failed"

### Test 4: Browser Console Verification

1. Open DevTools > Network tab
2. Download a shared file
3. **Verify response headers:**
   - `x-iv`: valid Base64 string (should be ~16 chars for 12-byte IV)
   - `x-auth-tag`: valid Base64 string (should be ~24 chars for 16-byte tag)
   - `x-share-salt`: valid Base64 string (should be ~24 chars for 16-byte salt)
4. **Check console logs:** Should show decoding success and detailed diagnostics

### Test 5: Header Format Validation

1. Add debug breakpoint in `handleDownload()` after header retrieval
2. Verify header values:
   - Should be strings, not undefined/null
   - Should not contain newlines or extra whitespace
   - Should match base64 character set: `[A-Za-z0-9+/=]`
3. Verify trimmed values are valid base64 before atob()

## Database Verification

### Check Stored Values Format

```javascript
// In MongoDB, verify file documents have:
db.files.findOne({ _id: ObjectId("...") }).then((file) => {
  console.log("IV:", file.encryptionIv); // Should be base64 string like "xyzABC+/=="
  console.log("AuthTag:", file.encryptionAuthTag); // Should be base64 string
  console.log("Salt:", file.shareSalt); // Should be base64 string
});
```

**Expected Format Examples:**

- IV (12 bytes encoded): `"x8kL9pQr2vW5YjN+Ma=="` (~16 chars)
- AuthTag (16 bytes encoded): `"aBcDeFgHiJkLmNoP+Qr=="` (~24 chars)
- Salt (16 bytes encoded): `"123456789AbCdEfGhIjK=="` (~24 chars)

## Backwards Compatibility

⚠️ **Important:** This fix uses new lowercase header names (`x-iv`, `x-auth-tag`, `x-share-salt`) instead of the old uppercase names.

**Migration Notes:**

- Old clients reading `X-Encryption-IV` will fail
- Old backends setting `X-Encryption-IV` need to be updated
- Ensure both frontend and backend are updated together

## Performance Impact

- **No performance degradation**
- Header validation is minimal (O(n) where n = header value length, typically < 100 chars)
- Base64 decoding is native browser function (unchanged)
- Error handling adds negligible overhead

## Security Considerations

- Base64 strings are NOT encrypted (they're encoding, not encryption)
- Header values are exposed in transit (use HTTPS)
- Validation prevents injection attacks via malformed headers
- Error messages don't expose sensitive data (truncated at 50 chars)

## Rollback Plan

If issues occur, rollback to previous header names:

1. Change backend header names back to `X-*` style
2. Update frontend header access back to `response.headers['x-encryption-iv']`
3. Remove error handling additions (revert to original `base64ToArrayBuffer`)
4. Redeploy both frontend and backend

## Success Criteria

✅ All these should be true after the fix:

- [ ] Shared file downloads work without Base64 errors
- [ ] Owner file downloads work without Base64 errors
- [ ] Error messages are helpful and diagnostic
- [ ] Network tab shows correct headers
- [ ] Downloaded files are intact and decryptable
- [ ] No console errors during normal file operations
- [ ] Edge cases (empty headers, invalid base64) handled gracefully
