import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, param, validationResult } from 'express-validator';
import pool from '../db/connection';
import { auth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(auth);
router.use(requireRole(['admin']));

router.get('/users', async (_req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(
    'SELECT id, username, display_name, email, role, created_at FROM users ORDER BY id'
  );
  res.json(rows);
});

router.post(
  '/users',
  [
    body('username').notEmpty().trim().isLength({ min: 3 }),
    body('password').notEmpty().isLength({ min: 4 }),
    body('displayName').optional({ nullable: true }).trim(),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().trim(),
    body('role').isIn(['admin', 'user']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, password, displayName, email, role } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ? OR email = ?', [username, email || '']);
    if ((existing as any[]).length) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, display_name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, displayName || null, email || null, role]
    );
    const r = result as any;
    res.status(201).json({ id: r.insertId, username, role });
  }
);

router.put(
  '/users/:id',
  [
    param('id').isInt(),
    body('displayName').optional().trim(),
    body('email').optional().isEmail().trim(),
    body('role').optional().isIn(['admin', 'user']),
    body('password').optional().isLength({ min: 4 }),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = req.params.id;
    const { displayName, email, role, password } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    if (displayName !== undefined) { updates.push('display_name = ?'); params.push(displayName); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (password) { updates.push('password_hash = ?'); params.push(await bcrypt.hash(password, 10)); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(id);
    const [result] = await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    const r = result as any;
    if (r.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  }
);

router.delete(
  '/users/:id',
  param('id').isInt(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = req.params.id;
    if (parseInt(id, 10) === req.user!.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    const r = result as any;
    if (r.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  }
);

// Dashboard stats
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  const [entryCount] = await pool.execute('SELECT COUNT(*) as c FROM score_entries');
  const [userCount] = await pool.execute('SELECT COUNT(*) as c FROM users');
  const [recentEntries] = await pool.execute(
    `SELECT se.id, se.created_at, e.name as event_name, se.gender
     FROM score_entries se
     JOIN events e ON se.event_id = e.id
     ORDER BY se.created_at DESC
     LIMIT 10`
  );
  const [districtStats] = await pool.execute(
    `SELECT d.name as district, COUNT(DISTINCT se.id) as entries, COUNT(sep.id) as players
     FROM districts d
     LEFT JOIN ds_offices do ON d.id = do.district_id
     LEFT JOIN score_entry_players sep ON do.id = sep.ds_office_id
     LEFT JOIN score_entries se ON sep.score_entry_id = se.id
     GROUP BY d.id, d.name
     ORDER BY d.id`
  );
  const [genderStats] = await pool.execute(
    `SELECT gender, COUNT(*) as count
     FROM score_entries
     GROUP BY gender`
  );
  const [eventStats] = await pool.execute(
    `SELECT e.name as event, COUNT(*) as count
     FROM score_entries se
     JOIN events e ON se.event_id = e.id
     GROUP BY e.id, e.name
     ORDER BY count DESC
     LIMIT 10`
  );
  res.json({
    totalEntries: (entryCount as any[])[0].c,
    totalUsers: (userCount as any[])[0].c,
    recentEntries: recentEntries as any[],
    districtStats: districtStats as any[],
    genderStats: genderStats as any[],
    eventStats: eventStats as any[],
  });
});

export default router;
