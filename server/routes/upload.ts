import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const uploadDir = path.resolve(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, name: req.file.originalname, type: req.file.mimetype });
});

export default router;
