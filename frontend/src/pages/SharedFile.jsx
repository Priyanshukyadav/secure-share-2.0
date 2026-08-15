import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  base64ToArrayBuffer,
  decryptFile,
  deriveKeyFromPassword
} from '../utils/encryption';
import { fileAPI } from '../services/api';
import '../styles/SharedFile.css';

export default function SharedFile() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    fetchFileInfo();
  }, [token]);

  const fetchFileInfo = async () => {
    try {
      const response = await fileAPI.getSharedFileInfo(token);
      setFileInfo(response.data.file);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shared file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDecrypting(true);

    try {
      if (!password) {
        throw new Error('Please enter the password');
      }

      // Download encrypted file
      const response = await fileAPI.downloadSharedFile(token);
      const encryptedData = response.data;

      // Safe header retrieval with error handling
      const ivHeader = response.headers['x-iv'];
      const saltHeader = response.headers['x-share-salt'];
      const authTagHeader = response.headers['x-auth-tag'];

      if (!ivHeader) {
        throw new Error('Missing encryption IV in response header. Server may not have sent proper headers.');
      }
      if (!saltHeader) {
        throw new Error('Missing salt in response header. Server may not have sent proper headers.');
      }

      console.log('📥 Downloaded encrypted file');
      console.log('  Size:', encryptedData.byteLength, 'bytes');
      console.log('  Headers:', {
        iv: ivHeader?.substring(0, 20) + '...',
        salt: saltHeader?.substring(0, 20) + '...',
        authTag: authTagHeader?.substring(0, 20) + '...'
      });

      // Safely decode Base64 with error handling
      let iv, salt;
      try {
        iv = base64ToArrayBuffer(ivHeader.trim());
      } catch (err) {
        throw new Error(`Failed to decode IV: ${err.message}. IV value: ${ivHeader?.substring(0, 50)}`);
      }

      try {
        salt = base64ToArrayBuffer(saltHeader.trim());
      } catch (err) {
        throw new Error(`Failed to decode salt: ${err.message}. Salt value: ${saltHeader?.substring(0, 50)}`);
      }

      // Derive key from password
      console.log('🔑 Deriving key from password...');
      const key = await deriveKeyFromPassword(password, salt);

      // Decrypt file
      console.log('🔓 Decrypting file...');
      const decryptedData = await decryptFile(encryptedData, key, iv);

      // Create download link
      const blob = new Blob([decryptedData]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ File downloaded and decrypted successfully');
      setMessage('File decrypted and downloaded successfully!');
    } catch (err) {
      const errorMsg = err.message || 'Failed to download or decrypt file';
      setError(errorMsg);
      console.error('❌ Download error:', errorMsg);
    } finally {
      setDecrypting(false);
    }
  };

  if (loading) {
    return (
      <div className="shared-container">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  if (!fileInfo) {
    return (
      <div className="shared-container">
        <div className="error-box">
          <p>❌ File not found or has expired</p>
          <a href="/">Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-container">
      <div className="shared-card">
        <h1>🔐 Password-Protected File</h1>

        <div className="file-info">
          <p><strong>Filename:</strong> {fileInfo.filename}</p>
          <p><strong>Size:</strong> {(fileInfo.size / 1024 / 1024).toFixed(2)} MB</p>
          <p><strong>Shared:</strong> {new Date(fileInfo.createdAt).toLocaleDateString()}</p>
          {fileInfo.expiresAt && (
            <p>
              <strong>Expires:</strong> {new Date(fileInfo.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleDownload}>
          <div className="form-group">
            <label htmlFor="password">Enter Password to Decrypt</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the password"
              disabled={decrypting}
              required
            />
            <small>The file is encrypted with AES-256-GCM. Only the correct password can decrypt it.</small>
          </div>

          <button type="submit" className="btn-primary" disabled={decrypting}>
            {decrypting ? 'Decrypting...' : 'Download & Decrypt'}
          </button>
        </form>

        <div className="info-box">
          <h3>🔒 How it Works</h3>
          <ul>
            <li>Your password derives an encryption key using PBKDF2</li>
            <li>The file is decrypted using AES-256-GCM in your browser</li>
            <li>The server never has access to your password or the plaintext file</li>
            <li>If the file is tampered with, decryption will fail</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
