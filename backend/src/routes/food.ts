import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeFoodImage, analyzeScreenshot, ContextualFactors } from '../services/claudeService';
import pool from '../database';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR ?? path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => { cb(null, `${Date.now()}${path.extname(file.originalname)}`); },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Se necesita una imagen' }); return; }
  try {
    const comment = (req.body.comment as string) ?? '';
    const contextual: ContextualFactors = {
      periodo: req.body.periodo === 'true',
      medicamentos: (req.body.medicamentos as string) || undefined,
    };
    const pid = Number(req.body.profileId) || 1;
    const { rows } = await pool.query('SELECT icr, isf, target_bg FROM profile WHERE id = $1', [pid]);
    const profile = rows[0];
    const profileParams = profile ? { icr: profile.icr, isf: profile.isf, targetBg: profile.target_bg } : undefined;

    const result = await analyzeFoodImage(req.file.path, comment, contextual, profileParams);
    res.json({ ...result, imagePath: req.file.filename });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al analizar imagen';
    res.status(500).json({ error: msg.includes('API') ? 'Error con la IA. Revisa la API key.' : msg });
  }
});

router.post('/analyze-cgm', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Se necesita una captura' }); return; }
  try {
    res.json(await analyzeScreenshot(req.file.path));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error' });
  }
});

export default router;
