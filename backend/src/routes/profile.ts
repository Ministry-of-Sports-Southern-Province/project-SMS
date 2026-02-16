import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import pool from '../db/connection';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(auth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(
    'SELECT id, username, display_name, email, role, preferred_lang, dark_mode FROM users WHERE id = ?',
    [req.user!.userId]
  );
  const users = rows as any[];
  if (!users.length) return res.status(404).json({ error: 'User not found' });
  const u = users[0];
  res.json({
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    email: u.email,
    role: u.role,
    preferredLang: u.preferred_lang,
    darkMode: !!u.dark_mode,
  });
});

router.put(
  '/',
  [
    body('displayName').optional().trim(),
    body('email').optional().isEmail().trim(),
    body('preferredLang').optional().isIn(['si', 'en', 'ta']),
    body('darkMode').optional().isBoolean(),
    body('password').optional().isLength({ min: 4 }),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { displayName, email, preferredLang, darkMode, password } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    if (displayName !== undefined) { updates.push('display_name = ?'); params.push(displayName); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (preferredLang !== undefined) { updates.push('preferred_lang = ?'); params.push(preferredLang); }
    if (darkMode !== undefined) { updates.push('dark_mode = ?'); params.push(darkMode); }
    if (password) { updates.push('password_hash = ?'); params.push(await bcrypt.hash(password, 10)); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.user!.userId);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ ok: true });
  }
);

export default router;
