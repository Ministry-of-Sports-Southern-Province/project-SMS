import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import i18n from 'i18next';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

interface Profile {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  preferredLang: string;
  darkMode: boolean;
  profilePicture?: string;
  bannerImage?: string;
}

const CLOUDINARY_UPLOAD_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState('si');
  const [profilePic, setProfilePic] = useState('');
  const [bannerImg, setBannerImg] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'profile' | 'banner' | null>(null);

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Profile>('/profile')
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName || '');
        setEmail(p.email || '');
        setLang(p.preferredLang || 'si');
        setProfilePic(p.profilePicture || '');
        setBannerImg(p.bannerImage || '');
      })
      .catch(console.error);
  }, []);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    // This is now handled by the backend
    // We just need to return the file for FormData submission
    return file.name;
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfilePic(true);
    setError('');
    try {
      // Create local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
        setSuccess('Profile picture selected (will upload on Save)');
        setTimeout(() => setSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setError('');
    try {
      // Create local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImg(reader.result as string);
        setSuccess('Banner selected (will upload on Save)');
        setTimeout(() => setSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteTarget) return;

    setError('');
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('email', email);
      formData.append('preferredLang', lang);

      // Set image to empty string to delete it
      if (deleteTarget === 'profile') {
        setProfilePic('');
        formData.append('profilePicture', '');
      } else {
        setBannerImg('');
        formData.append('bannerImage', '');
      }

      const token = localStorage.getItem('sms_token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || response.statusText);
      }

      setSuccess(`${deleteTarget === 'profile' ? 'Profile picture' : 'Banner'} removed`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();

      // Add text fields
      formData.append('displayName', displayName);
      formData.append('email', email);
      formData.append('preferredLang', lang);
      if (password) formData.append('password', password);

      // Add image URLs if they're actual URLs (not data URLs or blob URLs)
      if (profilePic && !profilePic.startsWith('data:') && !profilePic.startsWith('blob:')) {
        formData.append('profilePicture', profilePic);
      }
      if (bannerImg && !bannerImg.startsWith('data:') && !bannerImg.startsWith('blob:')) {
        formData.append('bannerImage', bannerImg);
      }

      // Add file objects if they were uploaded (from file inputs)
      if (profilePicInputRef.current?.files?.[0]) {
        formData.append('profilePictureFile', profilePicInputRef.current.files[0]);
      }
      if (bannerInputRef.current?.files?.[0]) {
        formData.append('bannerImageFile', bannerInputRef.current.files[0]);
      }

      const token = localStorage.getItem('sms_token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || response.statusText);
      }

      const result = await response.json();

      // Update local state with returned URLs
      if (result.profilePicture) setProfilePic(result.profilePicture);
      if (result.bannerImage) setBannerImg(result.bannerImage);

      i18n.changeLanguage(lang);
      const updatedUser = {
        ...user!,
        displayName,
        preferredLang: lang,
        profilePicture: result.profilePicture || profilePic,
      } as any;
      setUser(updatedUser);
      setPassword('');
      setSuccess(t('save'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Banner Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 150, sm: 200, md: 250 },
          borderRadius: 2,
          overflow: 'hidden',
          mb: -8,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          backgroundImage: bannerImg ? `url(${bannerImg})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid',
          borderColor: 'divider',
          zIndex: 1,
        }}
      >
        {/* Banner Upload Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            gap: 1,
          }}
          onClick={() => bannerInputRef.current?.click()}
        >
          {uploadingBanner ? (
            <CircularProgress size={40} sx={{ color: 'white' }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
              <CloudUploadIcon sx={{ fontSize: 28 }} />
              <Typography variant="subtitle2">{bannerImg ? 'Change banner' : 'Add banner'}</Typography>
            </Box>
          )}
        </Box>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleBannerChange}
          disabled={uploadingBanner}
        />
      </Box>

      {/* Main Profile Card */}
      <Paper
        sx={{
          position: 'relative',
          zIndex: 10,
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Avatar and Basic Info */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 4 },
            alignItems: { xs: 'center', sm: 'flex-start' },
            pb: 4,
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 4,
          }}
        >
          {/* Avatar */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profilePic}
              sx={{
                width: { xs: 100, sm: 140 },
                height: { xs: 100, sm: 140 },
                fontSize: '2.5rem',
                backgroundColor: 'primary.main',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              {!profilePic && getInitials(displayName || profile.username)}
            </Avatar>
            
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': { backgroundColor: 'primary.dark' },
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
              onClick={() => profilePicInputRef.current?.click()}
              disabled={uploadingProfilePic}
            >
              {uploadingProfilePic ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                <CameraAltIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
            <input
              ref={profilePicInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleProfilePicChange}
              disabled={uploadingProfilePic}
            />
          </Box>

          {/* User Info */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {displayName || profile.username}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              @{profile.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <Chip
                label={profile.role === 'admin' ? 'Administrator' : 'User'}
                color={profile.role === 'admin' ? 'error' : 'default'}
                variant="outlined"
                size="small"
              />
              <Chip
                label={
                  lang === 'si' ? 'සිංහල' : lang === 'en' ? 'English' : 'தமிழ்'
                }
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>

          {/* Delete Image Button */}
          {profilePic && (
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setDeleteTarget('profile');
                setDeleteDialogOpen(true);
              }}
              sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}
            >
              <DeleteIcon />
            </IconButton>
          )}
          {bannerImg && (
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  setDeleteTarget('banner');
                  setDeleteDialogOpen(true);
                }}
                sx={{
                  px: 4,
                  py: 1.2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 1,
                }}
              >
                Remove Banner
              </Button>
            )}
        </Box>

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
            {/* Username (Disabled) */}
            <TextField
              fullWidth
              label={t('username')}
              value={profile.username}
              disabled
              variant="outlined"
              sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}
            />

            {/* Display Name */}
            <TextField
              fullWidth
              label={t('displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              variant="outlined"
            />

            {/* Email */}
            <TextField
              fullWidth
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
            />

            {/* New Password */}
            <TextField
              fullWidth
              label={t('newPassword')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              variant="outlined"
              sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}
            />

            {/* Language Selection */}
            <FormControl fullWidth>
              <InputLabel>{t('lang')}</InputLabel>
              <Select value={lang} label={t('lang')} onChange={(e) => setLang(e.target.value)}>
                <MenuItem value="si">සිංහල</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ta">தமிழ்</MenuItem>
              </Select>
            </FormControl>

            {/* Role Display */}
            <TextField
              fullWidth
              label="Role"
              value={profile.role === 'admin' ? 'Administrator' : 'User'}
              disabled
              variant="outlined"
            />
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.2,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1,
              }}
            >
              {t('save')}
            </Button>
            
          </Box>
        </form>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete {deleteTarget === 'profile' ? 'Profile Picture' : 'Banner'}?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the {deleteTarget === 'profile' ? 'profile picture' : 'banner'}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteImage} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}