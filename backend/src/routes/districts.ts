import { Router, Request, Response } from 'express';
import pool from '../db/connection';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const [rows] = await pool.execute('SELECT id, name FROM districts ORDER BY id');
  res.json(rows);
});

export default router;
