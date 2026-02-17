import { Router, Request, Response } from 'express';
import pool from '../db/connection';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId as string;
  if (!categoryId) return res.status(400).json({ error: 'categoryId required' });

  const [rows] = await pool.execute(
    `SELECT e.id, e.name, e.is_relay, e.players_per_place, e.is_mixed, e.gender_restriction, erf.format as record_format
     FROM events e
     LEFT JOIN event_record_formats erf ON e.id = erf.event_id
     WHERE e.sport_category_id = ?
     ORDER BY e.id`,
    [categoryId]
  );
  res.json(rows);
});

export default router;
