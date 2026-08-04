import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../db/connection';
import { config } from '../config';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post(
  '/login',
  body('username').notEmpty().trim(),
  body('password').notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    // #region agent log
    fetch('http://127.0.0.1:7935/ingest/419cad35-8db2-43a6-a3d6-91a89eeb3d18',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc5c8f'},body:JSON.stringify({sessionId:'fc5c8f',runId:'pre-fix',hypothesisId:'D',location:'auth.ts:login',message:'backend login hit',data:{username,port:process.env.PORT||'3001'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Try username first, then email
    const [rows] = await pool.execute(
    'SELECT id, username, password_hash, display_name, role, preferred_lang, dark_mode, profile_picture FROM users WHERE username = ? OR email = ?',
    [username, username]
    );
    const users = rows as any[];
    if (!users.length) {
      // #region agent log
      fetch('http://127.0.0.1:7935/ingest/419cad35-8db2-43a6-a3d6-91a89eeb3d18',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc5c8f'},body:JSON.stringify({sessionId:'fc5c8f',runId:'pre-fix',hypothesisId:'B',location:'auth.ts:login:nouser',message:'user not found',data:{username},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // #region agent log
      fetch('http://127.0.0.1:7935/ingest/419cad35-8db2-43a6-a3d6-91a89eeb3d18',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc5c8f'},body:JSON.stringify({sessionId:'fc5c8f',runId:'pre-fix',hypothesisId:'B',location:'auth.ts:login:badpass',message:'password mismatch',data:{username,userId:user.id},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwt.secret as jwt.Secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        preferredLang: user.preferred_lang,
        darkMode: !!user.dark_mode,
        profilePicture: user.profile_picture,
      },
    });
  }
);

router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(
  'SELECT id, username, display_name, email, role, preferred_lang, dark_mode, profile_picture FROM users WHERE id = ?',
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
    profilePicture: u.profile_picture,
  });
});

export default router;
