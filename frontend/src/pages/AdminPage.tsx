import { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, TextField, DialogActions, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';

interface UserRow {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState('');

  const load = () => api<UserRow[]>('/admin/users').then(setUsers).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (u?: UserRow) => {
    setEditing(u || null);
    setUsername(u?.username || '');
    setPassword('');
    setDisplayName(u?.display_name || '');
    setEmail(u?.email || '');
    setRole((u?.role as 'admin' | 'user') || 'user');
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) {
        const body: Record<string, unknown> = { displayName, email, role };
        if (password) body.password = password;
        await api(`/admin/users/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        if (!username || !password) {
          setError(t('required'));
          return;
        }
        await api('/admin/users', {
          method: 'POST',
          body: JSON.stringify({ username, password, displayName, email, role }),
        });
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{t('users')}</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => handleOpen()}>
          {t('createUser')}
        </Button>
      </Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('username')}</TableCell>
              <TableCell>{t('displayName')}</TableCell>
              <TableCell>{t('email')}</TableCell>
              <TableCell>{t('role')}</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.display_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(u)}><Edit /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(u.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('edit') : t('createUser')}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <TextField fullWidth label={t('username')} value={username} onChange={(e) => setUsername(e.target.value)} disabled={!!editing} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label={t('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editing ? 'Leave blank to keep' : ''} sx={{ mb: 2 }} />
          <TextField fullWidth label={t('displayName')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
          <FormControl fullWidth>
            <InputLabel>{t('role')}</InputLabel>
            <Select value={role} label={t('role')} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}>
              <MenuItem value="admin">admin</MenuItem>
              <MenuItem value="user">user</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
