import { Router, Request, Response } from 'express';
import pool from '../database';
import { calculateDose } from '../services/doseCalculator';

const router = Router();

router.post('/calculate', async (req: Request, res: Response) => {
  const { carbs, currentBg, trend, foodDescription, imagePath, profileId } = req.body;
  const pid = Number(profileId) || 1;

  const { rows } = await pool.query('SELECT * FROM profile WHERE id = $1', [pid]);
  const profile = rows[0];
  if (!profile) { res.status(400).json({ error: 'Configura tu perfil primero' }); return; }

  const result = calculateDose({
    carbs: Number(carbs),
    currentBg: Number(currentBg),
    trend: trend ?? 'Flat',
    icr: profile.icr,
    isf: profile.isf,
    targetBg: profile.target_bg,
  });

  await pool.query(
    `INSERT INTO doses (profile_id, food_description, carbs, current_bg, trend,
       carb_dose, correction_dose, trend_adjustment, total_dose, image_path)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [pid, foodDescription ?? '', carbs, currentBg, trend ?? 'Flat',
     result.carbDose, result.correctionDose, result.trendAdjustment,
     result.roundedDose, imagePath ?? '']
  );

  res.json(result);
});

router.get('/history', async (req: Request, res: Response) => {
  const pid = Number(req.query['profileId']) || 1;
  const { rows } = await pool.query(
    'SELECT * FROM doses WHERE profile_id = $1 ORDER BY created_at DESC LIMIT 50',
    [pid]
  );
  res.json(rows);
});

router.delete('/history/:id', async (req: Request, res: Response) => {
  await pool.query('DELETE FROM doses WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

export default router;
