import { GridFSBucket } from 'mongodb';
import { getMongoDB } from './mongo.js';

let fileBucket;

export const getFileBucket = () => {
  if (!fileBucket) {
    fileBucket = new GridFSBucket(getMongoDB(), { bucketName: 'encryptedFiles' });
  }

  return fileBucket;
};
