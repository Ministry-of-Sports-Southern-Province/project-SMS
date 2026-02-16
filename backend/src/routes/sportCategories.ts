import { Router, Request, Response } from 'express';
import pool from '../db/connection';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const [rows] = await pool.execute('SELECT id, code, name FROM sport_categories ORDER BY code');
  res.json(rows);
});

export default router;
