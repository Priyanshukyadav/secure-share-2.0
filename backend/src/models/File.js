import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true
    },
    originalName: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream'
    },
    // Encryption metadata stored in base64
    encryptionIv: {
      type: String,
      required: true
    },
    encryptionAuthTag: {
      type: String,
      required: true
    },
    encryptedOnClient: {
      type: Boolean,
      default: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true
    },
    // PBKDF2 salt used for password-based decryption (stored in base64)
    shareSalt: {
      type: String
    },
    expiresAt: {
      type: Date
    },
    accessCount: {
      type: Number,
      default: 0
    },
    lastAccessedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Index for efficient queries
fileSchema.index({ owner: 1, createdAt: -1 });
fileSchema.index({ shareToken: 1 });
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('File', fileSchema);
