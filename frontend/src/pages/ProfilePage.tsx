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
  Tabs,
  Tab,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import i18n from 'i18next';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

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

// Custom simple TabPanel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  
  // State
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
  const [tabValue, setTabValue] = useState(0); // For handling Tabs

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Modern input styling for a less "MUI-ish" look
  const modernInputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)' },
      '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.2)' },
      '&.Mui-focused fieldset': { borderWidth: '1px' },
    }
  };

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfilePic(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
        setSuccess('Profile picture ready to save ✨');
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImg(reader.result as string);
        setSuccess('Banner ready to save ✨');
        setTimeout(() => setSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('email', email);
      formData.append('preferredLang', lang);
      if (password) formData.append('password', password);

      if (profilePic && !profilePic.startsWith('data:') && !profilePic.startsWith('blob:')) {
        formData.append('profilePicture', profilePic);
      }
      if (bannerImg && !bannerImg.startsWith('data:') && !bannerImg.startsWith('blob:')) {
        formData.append('bannerImage', bannerImg);
      }
      if (profilePicInputRef.current?.files?.[0]) {
        formData.append('profilePictureFile', profilePicInputRef.current.files[0]);
      }
      if (bannerInputRef.current?.files?.[0]) {
        formData.append('bannerImageFile', bannerInputRef.current.files[0]);
      }

      const token = localStorage.getItem('sms_token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || response.statusText);
      }

      const result = await response.json();
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
      setSuccess('Profile updated successfully! 🎉');
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

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        
        {/* Banner Section */}
        <Box
          sx={{
            height: 200,
            position: 'relative',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            backgroundImage: bannerImg ? `url(${bannerImg})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer',
            '&:hover .banner-overlay': { opacity: 1 },
          }}
          onClick={() => bannerInputRef.current?.click()}
        >
          <Box
            className="banner-overlay"
            sx={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploadingBanner ? 1 : 0, transition: 'opacity 0.2s',
            }}
          >
            {uploadingBanner ? <CircularProgress size={40} sx={{ color: 'white' }} /> : 
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
              <CloudUploadIcon sx={{ fontSize: 28 }} />
              <Typography variant="subtitle1" fontWeight={500}>Update Banner</Typography>
            </Box>}
          </Box>
          <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={handleBannerChange} disabled={uploadingBanner} />
        </Box>

        {/* Profile Header (Avatar & Info) */}
        <Box sx={{ px: 4, pb: 3, display: 'flex', alignItems: 'flex-end', mt: -7, position: 'relative', zIndex: 2 }}>
          <Box sx={{ position: 'relative', mr: 3 }}>
            <Avatar
              src={profilePic}
              sx={{
                width: 120, height: 120, border: '4px solid white',
                backgroundColor: 'primary.main', fontSize: '2.5rem', cursor: 'pointer',
                '&:hover': { opacity: 0.9 }
              }}
              onClick={() => profilePicInputRef.current?.click()}
            >
              {!profilePic && getInitials(displayName || profile.username)}
            </Avatar>
            <IconButton
              size="small"
              onClick={() => profilePicInputRef.current?.click()}
              sx={{
                position: 'absolute', bottom: 4, right: 4,
                backgroundColor: 'white', border: '1px solid', borderColor: 'divider',
                '&:hover': { backgroundColor: 'grey.100' },
              }}
            >
              <CameraAltIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </IconButton>
            <input ref={profilePicInputRef} type="file" accept="image/*" hidden onChange={handleProfilePicChange} disabled={uploadingProfilePic} />
          </Box>

          <Box sx={{ pb: 1, flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{displayName || profile.username}</Typography>
            <Typography variant="body2" color="text.secondary">@{profile.username}</Typography>
          </Box>
        </Box>

        {/* Tabs Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
         <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
        >
          <Tab label={t('general')} />
          <Tab label={t('security')} />
          <Tab label={t('preferences')} />
        </Tabs>
        </Box>

        {/* Form Content */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
          
          {/* TAB 0: General Info */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField fullWidth label={t('username')} value={profile.username} disabled sx={modernInputStyle} />
              <TextField fullWidth label={t('displayName')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} sx={modernInputStyle} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>Account Role</Typography>
                <Chip label={profile.role === 'admin' ? 'Administrator' : 'User'} color={profile.role === 'admin' ? 'primary' : 'default'} variant="filled" />
              </Box>
            </Box>
          </TabPanel>

          {/* TAB 1: Security */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField fullWidth label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={modernInputStyle} />
              <TextField fullWidth label={t('newPassword')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" sx={modernInputStyle} />
            </Box>
          </TabPanel>

          {/* TAB 2: Preferences */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth sx={modernInputStyle}>
                <InputLabel>{t('lang')}</InputLabel>
                <Select value={lang} label={t('lang')} onChange={(e) => setLang(e.target.value)}>
                  <MenuItem value="si">සිංහල</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="ta">தமிழ்</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </TabPanel>

          {/* Global Save Button */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              sx={{ px: 4, py: 1.2, borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '1rem' }}
            >
              {t('save')} 
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}