import { Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  Menu,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  SportsScore,
  List as ListIcon,
  Person,
  AdminPanelSettings,
  Dashboard,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { api } from '../api/client';

const drawerWidth = 260;

export default function MainLayout() {
  const { t } = useTranslation();
  const { user, logout, setUser } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileAnchorEl);

  const getInitials = (displayName: string, username: string): string => {
    const name = displayName || username;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleViewProfile = () => {
    setProfileAnchorEl(null);
    navigate('/profile');
  };

  const handleLogout = () => {
    setProfileAnchorEl(null);
    logout();
  };

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: <Dashboard />, adminOnly: true },
    { path: '/score-entry', label: t('scoreEntry'), icon: <SportsScore /> },
    { path: '/view-entries', label: t('viewAllEntries'), icon: <ListIcon /> },
    { path: '/profile', label: t('profile'), icon: <Person /> },
    { path: '/admin', label: t('admin'), icon: <AdminPanelSettings />, adminOnly: true },
  ].filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpen(!open)} edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('appTitle')}
          </Typography>
          <IconButton color="inherit" onClick={toggleMode}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 80, ml: 1 }}>
            <Select
              value={user?.preferredLang || 'si'}
              onChange={async (e) => {
                const lang = e.target.value as string;
                const i18n = await import('i18next');
                i18n.default.changeLanguage(lang);
                if (user) {
                  const updated = { ...user, preferredLang: lang };
                  setUser(updated);
                  try {
                    await import('../api/client').then(({ api }) =>
                      api('/profile', { method: 'PUT', body: JSON.stringify({ preferredLang: lang }) })
                    );
                  } catch (err) {
                    console.error('Failed to save language preference', err);
                  }
                }
              }}
              sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { border: 0 } }}
              variant="standard"
            >
              <MenuItem value="si">සිංහල</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="ta">தமிழ்</MenuItem>
            </Select>
          </FormControl>

          {/* Profile Avatar with Dropdown Menu */}
          <IconButton
            onClick={handleProfileMenuClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={profileMenuOpen ? 'profile-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={profileMenuOpen ? 'true' : undefined}
          >
            <Avatar
              src={(user as any)?.profilePicture}
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.light',
                color: 'primary.main',
                border: '2px solid white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {!user?.displayName && !user?.username ? (
                <CircularProgress size={24} />
              ) : (
                getInitials(user?.displayName || '', user?.username || '')
              )}
            </Avatar>
          </IconButton>

          {/* Profile Menu Dropdown */}
          <Menu
            id="profile-menu"
            anchorEl={profileAnchorEl}
            open={profileMenuOpen}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {user?.displayName || user?.username}
            </MenuItem>
            <MenuItem onClick={handleViewProfile}>
              <Person sx={{ mr: 1 }} fontSize="small" />
              {t('profile')}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              {t('logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: 64,
            height: 'calc(100% - 64px)',
          },
        }}
      >
        <List sx={{ pt: 2 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: open ? 0 : `-${drawerWidth}px` }}>
        <Outlet />
      </Box>
    </Box>
  );
}
