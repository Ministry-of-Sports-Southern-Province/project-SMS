import { Router, Request, Response } from 'express';
import pool from '../db/connection';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const districtId = req.query.districtId as string;
  if (!districtId) return res.status(400).json({ error: 'districtId required' });

  const [rows] = await pool.execute(
    'SELECT id, district_id, name FROM ds_offices WHERE district_id = ? ORDER BY name',
    [districtId]
  );
  res.json(rows);
});

export default router;
