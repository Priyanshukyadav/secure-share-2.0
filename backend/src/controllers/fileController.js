import { randomUUID } from 'crypto';
import File from '../models/File.js';
import { getFileBucket } from '../config/database.js';
import { generateShareToken, generateSalt, validateEncryptedFileMetadata } from '../utils/crypto.js';

/**
 * Upload encrypted file
 * POST /api/files/upload
 * 
 * Expected form data:
 * - file: encrypted file blob
 * - iv: base64 encoded IV
 * - authTag: base64 encoded authentication tag
 * - originalName: original filename
 */
export const uploadFile = async (req, res, next) => {
  let uploadedFilename;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const { iv, authTag, originalName, salt } = req.body;

    // Validate encryption metadata
    try {
      validateEncryptedFileMetadata(iv, authTag);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const filename = randomUUID();
    uploadedFilename = filename;
    const bucket = getFileBucket();
    await new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: 'application/octet-stream',
        metadata: { originalName: originalName || req.file.originalname }
      });
      uploadStream.once('error', reject);
      uploadStream.once('finish', resolve);
      uploadStream.end(req.file.buffer);
    });

    const fileData = {
      filename,
      originalName: originalName || req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      encryptionIv: iv,
      encryptionAuthTag: authTag,
      encryptedOnClient: true,
      owner: req.userId,
      isPublic: false
    };

    // Store salt if provided (password-protected file)
    if (salt) {
      fileData.shareSalt = salt;
    }

    const file = await File.create(fileData);

    console.log('✅ File uploaded successfully:', {
      fileId: file._id,
      filename: file.filename,
      size: file.size,
      owner: req.userId,
      passwordProtected: !!salt
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        filename: file.originalName,
        size: file.size,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    if (uploadedFilename) {
      try {
        const bucket = getFileBucket();
        const storedFile = await bucket.find({ filename: uploadedFilename }).next();
        if (storedFile) {
          await bucket.delete(storedFile._id);
        }
      } catch (cleanupError) {
        console.error('Error deleting failed upload:', cleanupError);
      }
    }
    next(error);
  }
};

/**
 * Download encrypted file
 * GET /api/files/:id/download
 * 
 * Returns:
 * - encrypted file binary
 * - IV in header (base64)
 * - authTag in header (base64)
 */
export const downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check authorization (owner only)
    if (file.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this file'
      });
    }

    const bucket = getFileBucket();
    const storedFile = await bucket.find({ filename: file.filename }).next();
    if (!storedFile) {
      return res.status(404).json({
        success: false,
        message: 'File data not found on server'
      });
    }

    // Send file with encryption metadata in headers
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'x-iv': String(file.encryptionIv || ''),
      'x-auth-tag': String(file.encryptionAuthTag || ''),
      'x-file-size': String(file.size || 0)
    });

    console.log('✅ File downloaded:', {
      fileId: file._id,
      userId: req.userId,
      size: file.size,
      iv: file.encryptionIv
    });

    bucket.openDownloadStreamByName(file.filename).on('error', next).pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get file metadata
 * GET /api/files/:id
 */
export const getFileMetadata = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).select('-__v');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check authorization (owner only)
    if (file.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this file'
      });
    }

    res.status(200).json({
      success: true,
      file: {
        id: file._id,
        filename: file.originalName,
        size: file.size,
        createdAt: file.createdAt,
        isPublic: file.isPublic,
        shareToken: file.shareToken,
        expiresAt: file.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List user's files
 * GET /api/files
 */
export const listUserFiles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const files = await File.find({ owner: req.userId })
      .select('_id originalName size isPublic shareToken shareSalt expiresAt createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await File.countDocuments({ owner: req.userId });

    res.status(200).json({
      success: true,
      files,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete file
 * DELETE /api/files/:id
 */
export const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check authorization
    if (file.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this file'
      });
    }

    const bucket = getFileBucket();
    const storedFile = await bucket.find({ filename: file.filename }).next();
    if (storedFile) {
      await bucket.delete(storedFile._id);
    }

    // Delete from database
    await File.deleteOne({ _id: file._id });

    console.log('✅ File deleted:', { fileId: file._id, userId: req.userId });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Share file
 * POST /api/files/:id/share
 *
 * Body:
 * - expiresIn: optional, expiration time in hours
 * The original file password is already stored at upload time; no second share password is needed.
 */
export const shareFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check authorization
    if (file.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to share this file'
      });
    }

    const { expiresIn } = req.body;

    // If file doesn't have salt, it can't be shared (it was encrypted with random key)
    if (!file.shareSalt) {
      return res.status(400).json({
        success: false,
        message: 'File must be uploaded with password protection to share. Please upload with a password.'
      });
    }

    // Generate share token
    const shareToken = generateShareToken();

    // Set expiration if provided
    let expiresAt = null;
    if (expiresIn && typeof expiresIn === 'number') {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    // Update file
    file.isPublic = true;
    file.shareToken = shareToken;
    if (expiresAt) {
      file.expiresAt = expiresAt;
    }
    await file.save();

    console.log('✅ File shared:', {
      fileId: file._id,
      shareToken,
      expiresAt,
      saltUsed: file.shareSalt
    });

    res.status(200).json({
      success: true,
      message: 'File shared successfully',
      shareToken,
      shareUrl: `${process.env.CLIENT_URL}/shared/${shareToken}`,
      expiresAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download shared file
 * GET /api/files/shared/:token/download
 * 
 * Returns:
 * - encrypted file binary
 * - IV in header (base64)
 * - authTag in header (base64)
 * - salt in header (base64) for password verification
 */
export const downloadSharedFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ shareToken: req.params.token });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Shared file not found'
      });
    }

    // Check if file has expired
    if (file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'Shared file has expired'
      });
    }

    const bucket = getFileBucket();
    const storedFile = await bucket.find({ filename: file.filename }).next();
    if (!storedFile) {
      return res.status(404).json({
        success: false,
        message: 'File data not found on server'
      });
    }

    // Update access count
    file.accessCount += 1;
    file.lastAccessedAt = new Date();
    await file.save();

    // Send file with encryption metadata in headers
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'x-iv': String(file.encryptionIv || ''),
      'x-auth-tag': String(file.encryptionAuthTag || ''),
      'x-share-salt': String(file.shareSalt || ''),
      'x-file-size': String(file.size || 0)
    });

    console.log('✅ Shared file downloaded:', {
      fileId: file._id,
      shareToken: req.params.token,
      size: file.size,
      iv: file.encryptionIv,
      salt: file.shareSalt
    });

    bucket.openDownloadStreamByName(file.filename).on('error', next).pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get shared file info
 * GET /api/files/shared/:token
 */
export const getSharedFileInfo = async (req, res, next) => {
  try {
    const file = await File.findOne({ shareToken: req.params.token }).select(
      '_id originalName size createdAt expiresAt'
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Shared file not found'
      });
    }

    // Check if file has expired
    if (file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'Shared file has expired'
      });
    }

    res.status(200).json({
      success: true,
      file: {
        id: file._id,
        filename: file.originalName,
        size: file.size,
        createdAt: file.createdAt,
        expiresAt: file.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};
