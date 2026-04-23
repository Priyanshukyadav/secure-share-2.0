import React, { useState, useEffect } from 'react';
import {
  base64ToArrayBuffer,
  decryptFile,
  importKey
} from '../utils/encryption';
import { retrieveKey, deleteKey, hasKey } from '../utils/storage';
import { fileAPI } from '../services/api';
import '../styles/Components.css';

export default function FileList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decryptingId, setDecryptingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiry, setShareExpiry] = useState(0);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fileAPI.listFiles();
      setFiles(response.data.files);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    if (!hasKey(fileId)) {
      setError('Encryption key not found. The key may have been cleared.');
      return;
    }

    setDecryptingId(fileId);

    try {
      // Get stored key
      const keyData = retrieveKey(fileId);
      if (!keyData) {
        throw new Error('Encryption key not found');
      }

      // Import key for decryption
      const key = await importKey(keyData);

      // Download encrypted file
      const response = await fileAPI.download(fileId);
      const encryptedData = response.data;

      // Safe header retrieval with error handling
      const ivHeader = response.headers['x-iv'];
      if (!ivHeader) {
        throw new Error('Missing encryption IV in response header');
      }

      console.log('📥 Downloaded encrypted file');
      console.log('  Size:', encryptedData.byteLength, 'bytes');

      // Safely decode Base64 with error handling
      let iv;
      try {
        iv = base64ToArrayBuffer(ivHeader.trim());
      } catch (err) {
        throw new Error(`Failed to decode IV: ${err.message}`);
      }

      // Decrypt file
      console.log('🔓 Decrypting file...');
      const decryptedData = await decryptFile(encryptedData, key, iv);

      // Create download link
      const blob = new Blob([decryptedData]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ File decrypted and downloaded');
    } catch (err) {
      setError(err.message || 'Failed to decrypt file');
      console.error('❌ Decryption error:', err);
    } finally {
      setDecryptingId(null);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await fileAPI.delete(fileId);
      deleteKey(fileId);
      setFiles(files.filter(f => f._id !== fileId));
      console.log('✅ File deleted');
    } catch (err) {
      setError('Failed to delete file');
      console.error('Delete error:', err);
    }
  };

  const handleShare = async (fileId) => {
    if (!sharePassword) {
      setError('Please enter a password for sharing');
      return;
    }

    setSharingId(fileId);

    try {
      // For shared files, we generate a new salt for PBKDF2
      const { generateSalt, arrayBufferToBase64 } = await import('../utils/encryption');
      const salt = generateSalt();
      const saltBase64 = arrayBufferToBase64(salt);

      const response = await fileAPI.share(fileId, saltBase64, shareExpiry || undefined);

      const shareLink = response.data.shareUrl;
      const text = `Check out this encrypted file: ${shareLink}\nPassword: ${sharePassword}\n\nPassword is required to decrypt it!`;

      // Copy to clipboard
      await navigator.clipboard.writeText(text);

      setError('');
      alert(`Share link copied to clipboard!\n\nShare link: ${shareLink}\nPassword: ${sharePassword}`);

      setSharePassword('');
      setShareExpiry(0);
      setSharingId(null);
    } catch (err) {
      setError('Failed to share file');
      console.error('Share error:', err);
    }
  };

  if (loading) {
    return <div className="loader">Loading files...</div>;
  }

  return (
    <div className="files-card">
      <h2>📁 Your Files</h2>

      {error && <div className="error-message">{error}</div>}

      {files.length === 0 ? (
        <p className="empty-message">No files uploaded yet. Upload a file to get started!</p>
      ) : (
        <div className="files-list">
          {files.map(file => (
            <div key={file._id} className="file-item">
              <div className="file-details">
                <h3>📄 {file.originalName}</h3>
                <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Uploaded:</strong> {new Date(file.createdAt).toLocaleDateString()}</p>
                {file.isPublic && (
                  <p><strong>Status:</strong> 🌍 Shared (Expires: {file.expiresAt ? new Date(file.expiresAt).toLocaleDateString() : 'Never'})</p>
                )}
              </div>

              <div className="file-actions">
                <button
                  onClick={() => handleDownload(file._id, file.originalName)}
                  disabled={decryptingId === file._id || !hasKey(file._id)}
                  className="btn-small"
                >
                  {decryptingId === file._id ? 'Decrypting...' : hasKey(file._id) ? '⬇️ Download' : '🔑 No Key'}
                </button>

                <button
                  onClick={() => {
                    setSharingId(sharingId === file._id ? null : file._id);
                    setSharePassword('');
                  }}
                  className="btn-small"
                  disabled={sharingId !== null && sharingId !== file._id}
                >
                  🔗 Share
                </button>

                <button
                  onClick={() => handleDelete(file._id)}
                  className="btn-small btn-danger"
                >
                  🗑️ Delete
                </button>
              </div>

              {sharingId === file._id && (
                <div className="share-form">
                  <div className="form-group">
                    <label>Password for Recipient</label>
                    <input
                      type="password"
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                      placeholder="Enter password for sharing"
                    />
                  </div>

                  <div className="form-group">
                    <label>Expiration (hours, 0 = never)</label>
                    <input
                      type="number"
                      value={shareExpiry}
                      onChange={(e) => setShareExpiry(parseInt(e.target.value))}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <button
                    onClick={() => handleShare(file._id)}
                    disabled={sharingId !== file._id}
                    className="btn-primary"
                  >
                    Generate Share Link
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
