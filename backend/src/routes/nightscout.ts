import { Router, Request, Response } from 'express';
import pool from '../database';
import { fetchCurrentReading } from '../services/nightscoutService';

const router = Router();

router.get('/current', async (_req: Request, res: Response) => {
  const { rows } = await pool.query(
    'SELECT nightscout_url, nightscout_token FROM profile WHERE id = 1'
  );
  const profile = rows[0];

  if (!profile?.nightscout_url) {
    res.status(400).json({ error: 'Nightscout no configurado en el perfil' }); return;
  }

  try {
    const reading = await fetchCurrentReading(profile.nightscout_url, profile.nightscout_token ?? '');
    res.json(reading);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error conectando con Nightscout';
    res.status(500).json({ error: msg });
  }
});

export default router;
