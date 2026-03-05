import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import multer, { MulterError } from 'multer';
import pool from '../db/connection';
import { auth, AuthRequest } from '../middleware/auth';
import { uploadToCloudinary, deleteFromCloudinary, validateImage } from '../utils/cloudinary';

const router = Router();
router.use(auth);

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(
    'SELECT id, username, display_name, email, role, preferred_lang, dark_mode, profile_picture, banner_image FROM users WHERE id = ?',
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
    profilePicture: u.profile_picture || null,
    bannerImage: u.banner_image || null,
  });
});

router.put(
  '/',
  upload.fields([
    { name: 'profilePictureFile', maxCount: 1 },
    { name: 'bannerImageFile', maxCount: 1 },
  ]),
  [
    body('displayName').optional().trim(),
    body('email').optional().isEmail().trim(),
    body('preferredLang').optional().isIn(['si', 'en', 'ta']),
    body('darkMode').optional().isBoolean(),
    body('password').optional().isLength({ min: 4 }),
    body('profilePicture').optional().trim(),
    body('bannerImage').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { displayName, email, preferredLang, darkMode, password, profilePicture, bannerImage } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};

      console.log('Profile update request:', {
        displayName,
        email,
        preferredLang,
        hasProfilePictureFile: !!files.profilePictureFile,
        hasBannerImageFile: !!files.bannerImageFile,
        profilePictureUrl: profilePicture ? 'provided' : 'not provided',
        bannerImageUrl: bannerImage ? 'provided' : 'not provided',
      });

      // Get current user data to track old images
      const [currentRows] = await pool.execute(
        'SELECT profile_picture, banner_image FROM users WHERE id = ?',
        [req.user!.userId]
      );
      const current = (currentRows as any[])[0];

      const updates: string[] = [];
      const params: any[] = [];
      let newProfilePicture = profilePicture || current?.profile_picture;
      let newBannerImage = bannerImage || current?.banner_image;

      // Handle profile picture upload
      if (files.profilePictureFile && files.profilePictureFile[0]) {
        try {
          const file = files.profilePictureFile[0];
          console.log('Uploading profile picture:', {
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          });

          const validation = validateImage(file.buffer, file.originalname);
          if (!validation.valid) {
            console.error('Image validation failed:', validation.error);
            return res.status(400).json({ error: validation.error });
          }

          // Upload to Cloudinary
          console.log('Starting Cloudinary upload for profile picture...');
          const result = await uploadToCloudinary(file.buffer, file.originalname, 'sms_profile');
          console.log('Cloudinary upload successful:', result.secure_url);
          newProfilePicture = result.secure_url;

          // Delete old profile picture from Cloudinary if it exists
          if (current?.profile_picture) {
            console.log('Deleting old profile picture:', current.profile_picture);
            await deleteFromCloudinary(current.profile_picture).catch(console.error);
          }
        } catch (err) {
          console.error('Profile picture upload error:', err);
          return res.status(400).json({ error: err instanceof Error ? err.message : 'Image upload failed' });
        }
      }

      // Handle banner image upload
      if (files.bannerImageFile && files.bannerImageFile[0]) {
        try {
          const file = files.bannerImageFile[0];
          console.log('Uploading banner image:', {
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          });

          const validation = validateImage(file.buffer, file.originalname);
          if (!validation.valid) {
            console.error('Image validation failed:', validation.error);
            return res.status(400).json({ error: validation.error });
          }

          // Upload to Cloudinary
          console.log('Starting Cloudinary upload for banner...');
          const result = await uploadToCloudinary(file.buffer, file.originalname, 'sms_banners');
          console.log('Cloudinary upload successful:', result.secure_url);
          newBannerImage = result.secure_url;

          // Delete old banner image from Cloudinary if it exists
          if (current?.banner_image) {
            console.log('Deleting old banner image:', current.banner_image);
            await deleteFromCloudinary(current.banner_image).catch(console.error);
          }
        } catch (err) {
          console.error('Banner upload error:', err);
          return res.status(400).json({ error: err instanceof Error ? err.message : 'Image upload failed' });
        }
      }

      // Handle clearing images
      if (profilePicture === null || profilePicture === '') {
        console.log('Clearing profile picture');
        if (current?.profile_picture) {
          await deleteFromCloudinary(current.profile_picture).catch(console.error);
        }
        newProfilePicture = null;
      }

      if (bannerImage === null || bannerImage === '') {
        console.log('Clearing banner image');
        if (current?.banner_image) {
          await deleteFromCloudinary(current.banner_image).catch(console.error);
        }
        newBannerImage = null;
      }

      // Build update query
      if (displayName !== undefined) {
        updates.push('display_name = ?');
        params.push(displayName);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        params.push(email);
      }
      if (preferredLang !== undefined) {
        updates.push('preferred_lang = ?');
        params.push(preferredLang);
      }
      if (darkMode !== undefined) {
        updates.push('dark_mode = ?');
        params.push(darkMode);
      }
      if (password) {
        updates.push('password_hash = ?');
        params.push(await bcrypt.hash(password, 10));
      }
      if (newProfilePicture !== current?.profile_picture) {
        updates.push('profile_picture = ?');
        params.push(newProfilePicture);
      }
      if (newBannerImage !== current?.banner_image) {
        updates.push('banner_image = ?');
        params.push(newBannerImage);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      console.log('Updating database with new images:', {
        newProfilePicture: newProfilePicture ? 'set' : 'null',
        newBannerImage: newBannerImage ? 'set' : 'null',
      });

      params.push(req.user!.userId);
      await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

      console.log('Profile updated successfully');
      res.json({
        ok: true,
        profilePicture: newProfilePicture,
        bannerImage: newBannerImage,
      });
    } catch (err) {
      if (err instanceof MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: `File error: ${err.message}` });
      }
      console.error('Profile update error:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

export default router;
