import { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import i18n from 'i18next';

interface Profile {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  preferredLang: string;
  darkMode: boolean;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState('si');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<Profile>('/profile').then((p) => {
      setProfile(p);
      setDisplayName(p.displayName || '');
      setEmail(p.email || '');
      setLang(p.preferredLang || 'si');
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const body: Record<string, unknown> = { displayName, email, preferredLang: lang };
      if (password) body.password = password;
      await api('/profile', { method: 'PUT', body: JSON.stringify(body) });
      i18n.changeLanguage(lang);
      setUser({ ...user!, displayName, preferredLang: lang });
      setPassword('');
      setSuccess(t('save'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (!profile) return null;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('profile')}
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TextField fullWidth label={t('username')} value={profile.username} disabled sx={{ mb: 2 }} />
          <TextField fullWidth label={t('displayName')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label={t('newPassword')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep" sx={{ mb: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('lang')}</InputLabel>
            <Select value={lang} label={t('lang')} onChange={(e) => setLang(e.target.value)}>
              <MenuItem value="si">සිංහල</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="ta">தமிழ்</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained">
            {t('save')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
