import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database';
import { estimateParamsFromTDD } from '../services/doseCalculator';

const router = Router();

router.get('/all', async (_req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT id, name, theme_color, dark_mode,
       (username IS NOT NULL AND username != '') AS has_password
     FROM profile ORDER BY id`
  );
  res.json(rows);
});

router.post('/login-by-username', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) { res.status(400).json({ error: 'Faltan credenciales' }); return; }

  const { rows } = await pool.query(
    'SELECT id, name, username, password_hash FROM profile WHERE LOWER(username) = LOWER($1)',
    [username.trim()]
  );
  const profile = rows[0];

  if (!profile || !profile.password_hash) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' }); return;
  }

  const valid = await bcrypt.compare(password, profile.password_hash);
  if (!valid) { res.status(401).json({ error: 'Usuario o contraseña incorrectos' }); return; }

  res.json({ ok: true, id: profile.id, name: profile.name });
});

router.post('/login/:id', async (req: Request, res: Response) => {
  const { pin } = req.body as { pin: string };
  const { rows } = await pool.query('SELECT name, pin FROM profile WHERE id = $1', [req.params.id]);
  const profile = rows[0];
  if (!profile) { res.status(404).json({ error: 'Perfil no encontrado' }); return; }
  if (!profile.pin) { res.json({ ok: true, name: profile.name }); return; }
  if (profile.pin === pin) { res.json({ ok: true, name: profile.name }); return; }
  res.status(401).json({ error: 'PIN incorrecto' });
});

router.post('/new', async (req: Request, res: Response) => {
  const { name, icr, isf, target_bg, dia, nightscout_url, nightscout_token,
          units, pin, theme_color, username, password } = req.body;

  const password_hash = password ? await bcrypt.hash(password, 12) : '';

  const { rows } = await pool.query(
    `INSERT INTO profile (name, icr, isf, target_bg, dia, nightscout_url, nightscout_token,
       units, setup_done, pin, theme_color, username, password_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,$10,$11,$12) RETURNING id`,
    [name, icr ?? 10, isf ?? 50, target_bg ?? 100, dia ?? 3.5,
     nightscout_url ?? '', nightscout_token ?? '', units ?? 'mg/dL',
     pin ?? '', theme_color ?? 'blue', username?.trim() ?? '', password_hash]
  );
  res.json({ ok: true, id: rows[0].id });
});

router.get('/:id', async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT id, name, icr, isf, target_bg, dia, nightscout_url, nightscout_token,
       units, setup_done, pin, dark_mode, theme_color, username
     FROM profile WHERE id = $1`,
    [req.params.id]
  );
  res.json(rows[0] ?? null);
});

router.post('/:id', async (req: Request, res: Response) => {
  const { name, icr, isf, target_bg, dia, nightscout_url, nightscout_token,
          units, pin, dark_mode, theme_color, username, password } = req.body;

  if (password) {
    const hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE profile SET username=$1, password_hash=$2 WHERE id=$3',
      [username?.trim() ?? '', hash, req.params.id]);
  } else if (username !== undefined) {
    await pool.query('UPDATE profile SET username=$1 WHERE id=$2',
      [username?.trim() ?? '', req.params.id]);
  }

  await pool.query(
    `UPDATE profile SET name=$1, icr=$2, isf=$3, target_bg=$4, dia=$5,
       nightscout_url=$6, nightscout_token=$7, units=$8, setup_done=1,
       pin=$9, dark_mode=$10, theme_color=$11
     WHERE id=$12`,
    [name, icr, isf, target_bg, dia,
     nightscout_url ?? '', nightscout_token ?? '', units ?? 'mg/dL',
     pin ?? '', dark_mode ? 1 : 0, theme_color ?? 'blue', req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await pool.query('DELETE FROM doses WHERE profile_id = $1', [req.params.id]);
  await pool.query('DELETE FROM profile WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.post('/util/estimate-from-tdd', (req: Request, res: Response) => {
  const { tdd } = req.body as { tdd: number };
  if (!tdd || tdd <= 0) { res.status(400).json({ error: 'TDD debe ser mayor que 0' }); return; }
  res.json(estimateParamsFromTDD(tdd));
});

export default router;
