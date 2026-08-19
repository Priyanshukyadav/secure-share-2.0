import express from 'express';
import multer from 'multer';
import {
  uploadFile,
  downloadFile,
  getFileMetadata,
  listUserFiles,
  deleteFile,
  shareFile,
  downloadSharedFile,
  getSharedFileInfo
} from '../controllers/fileController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for encrypted storage
    cb(null, true);
  }
});

const router = express.Router();

// Authenticated routes (owner's files)
router.post('/upload', authenticate, uploadLimiter, upload.single('file'), uploadFile);
router.get('/', authenticate, listUserFiles);
router.get('/:id', authenticate, getFileMetadata);
router.get('/:id/download', authenticate, downloadFile);
router.delete('/:id', authenticate, deleteFile);
router.post('/:id/share', authenticate, shareFile);

// Shared file routes (public, no auth required)
router.get('/shared/:token', getSharedFileInfo);
router.get('/shared/:token/download', downloadSharedFile);

export default router;
