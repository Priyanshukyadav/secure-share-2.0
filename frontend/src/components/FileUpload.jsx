import React, { useState } from 'react';
import {
  generateAESKey,
  generateIV,
  generateSalt,
  deriveKeyFromPassword,
  encryptFile,
  exportKey,
  arrayBufferToBase64
} from '../utils/encryption';
import { storeKey } from '../utils/storage';
import { fileAPI } from '../services/api';
import '../styles/Components.css';

export default function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const maxSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 104857600; // 100MB
      if (selectedFile.size > maxSize) {
        setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        setFile(null);
      } else {
        setFile(selectedFile);
        setError('');
        setMessage('');
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (usePassword && (!password || !confirmPassword)) {
      setError('Please enter both password and confirmation');
      return;
    }

    if (usePassword && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (usePassword && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setMessage('');
    setUploading(true);
    setProgress(0);

    try {
      let key, salt;
      const iv = generateIV();

      // Derive key from password if provided, otherwise generate random key
      if (usePassword && password) {
        console.log('🔑 Deriving AES-256 key from password...');
        salt = generateSalt();
        key = await deriveKeyFromPassword(password, salt);
      } else {
        console.log('🔑 Generating random AES-256 key...');
        key = await generateAESKey();
      }

      setProgress(20);

      // Encrypt file
      console.log('🔐 Encrypting file...');
      const encryptedData = await encryptFile(file, key, iv);

      setProgress(50);

      // Export key for storage
      const exportedKey = await exportKey(key);
      const ivBase64 = arrayBufferToBase64(iv);
      const authTagBase64 = ivBase64.substring(0, 24); // Placeholder for auth tag

      // The last 16 bytes of AES-GCM ciphertext are the auth tag
      // We extract it from the encrypted data
      const authTagArray = new Uint8Array(encryptedData).slice(-16);
      const authTagBase64Final = arrayBufferToBase64(authTagArray);

      setProgress(70);

      // Create blob from encrypted data (without the auth tag, as it's included in the ciphertext)
      const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });

      // Upload encrypted file
      console.log('📤 Uploading encrypted file...');
      const saltBase64 = salt ? arrayBufferToBase64(salt) : null;
      const response = await fileAPI.upload(
        encryptedBlob,
        ivBase64,
        authTagBase64Final,
        file.name,
        saltBase64
      );

      setProgress(90);

      // Store key in sessionStorage
      storeKey(response.data.file.id, exportedKey);

      setProgress(100);

      setMessage(`✅ File encrypted and uploaded successfully! File ID: ${response.data.file.id}${usePassword ? ' (Password protected)' : ''}`);
      console.log('✅ Upload complete');
      setFile(null);
      setPassword('');
      setConfirmPassword('');
      setUsePassword(false);

      // Reset form
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      // Notify parent to refresh file list
      onUploadSuccess();
    } catch (err) {
      const errorMsg = err.message || 'Upload failed';
      setError(errorMsg);
      console.error('❌ Upload error:', errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-card">
      <h2>📤 Upload & Encrypt File</h2>
      <p className="upload-subtitle">Select a file to encrypt and upload securely</p>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <form onSubmit={handleUpload}>
        <div className="file-input-group">
          <label htmlFor="file-input" className="file-label">
            {file ? `📄 ${file.name}` : '📁 Click to select file or drag & drop'}
          </label>
          <input
            type="file"
            id="file-input"
            onChange={handleFileSelect}
            disabled={uploading}
            accept="*"
          />
        </div>

        {file && (
          <div className="file-info">
            <p><strong>Filename:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <div className="password-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={usePassword}
              onChange={(e) => setUsePassword(e.target.checked)}
              disabled={uploading}
            />
            🔐 Protect with password (for sharing)
          </label>

          {usePassword && (
            <div className="password-inputs">
              <input
                type="password"
                placeholder="Enter password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={uploading}
                className="form-input"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={uploading}
                className="form-input"
              />
            </div>
          )}
        </div>

        {uploading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={!file || uploading}>
          {uploading ? 'Encrypting & Uploading...' : 'Upload & Encrypt'}
        </button>
      </form>

      <div className="info-box">
        <h3>🔒 Security</h3>
        <ul>
          <li>Your file is encrypted with AES-256-GCM before upload</li>
          <li>The encryption key is stored in your browser's sessionStorage</li>
          <li>The server never sees your plaintext or encryption key</li>
          <li>Clearing your browser session will erase the key</li>
        </ul>
      </div>
    </div>
  );
}
