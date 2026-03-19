import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  useMediaQuery,
  useTheme,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

// ─── Global styles ────────────────────────────────────────────────────────────
const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .login-page-root {
    animation: fadeIn 0.5s ease both;
  }
  
  .category-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: default;
    padding: 12px;
    border-radius: 12px;
  }
  
  .category-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(8px);
  }

  .category-card:hover .icon-container {
    color: hsl(210, 100%, 70%) !important;
    filter: drop-shadow(0 0 8px hsla(210, 100%, 70%, 0.5));
  }

  /* Smooth scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: hsla(210, 20%, 50%, 0.3);
    border-radius: 4px;
  }
`;

// ─── Sport categories (6 items organized 3+3) ───────────────────────────────
const categories = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2"/><path d="M12 7v5l3 3"/><path d="M6.5 17.5c1-2 3-3.5 5.5-3.5s4.5 1.5 5.5 3.5"/>
        <line x1="8" y1="21" x2="8.5" y2="17.5"/><line x1="16" y1="21" x2="15.5" y2="17.5"/>
      </svg>
    ),
    label: 'මලල ක්‍රීඩා',
    desc: 'ධාවන හා පිම්ම ඉසව්, කෙටි දුර ධාවන, කඩුලු පැනීම සහ බහුවිධ ක්‍රීඩා තරඟ.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12c0-4 3-7 8-7s8 3 8 7"/><path d="M4 12c1-1 2-1.5 4-1s3 2 4 2 3-1.5 4-2"/>
        <path d="M12 19v-7"/><circle cx="12" cy="20" r="1"/>
      </svg>
    ),
    label: 'පිහිනුම්',
    desc: 'පිහිනුම් තටාක සහ විවෘත ජලාශ්‍රිතව පැවැත්වෙන සියලුම පිහිනුම් ක්‍රම සහ තරඟ.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2"/><path d="M9 22V12l-3-4h12l-3 4v10"/><path d="M6 8l-2 3"/><path d="M18 8l2 3"/>
      </svg>
    ),
    label: 'ජිම්නාස්ටික්',
    desc: 'විනිශ්චය මණ්ඩලයක් මගින් ලකුණු ලබා දෙන කලාත්මක සහ රිද්මයානුකූල ක්‍රීඩා ඉසව්.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 3c0 0-4 4-4 9s4 9 4 9"/><path d="M12 3c0 0 4 4 4 9s-4 9-4 9"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
      </svg>
    ),
    label: 'කණ්ඩායම් ක්‍රීඩා',
    desc: 'පාපන්දු, පැසපන්දු, වොලිබෝල් ඇතුළු සියලුම සාමූහික කණ්ඩායම් ක්‍රීඩා.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18h12M12 12v6M9 12v6M15 12v6M7 12h10l1 1v4l-1 1H7l-1-1v-4l1-1zM12 3v3M9 6v3h6V6"/>
      </svg>
    ),
    label: 'බර පන්ති යටතේ ක්‍රීඩා',
    desc: 'බොක්සිං, ජූඩෝ සහ කරාතේ ඇතුළු සිරුරේ බර පන්ති අනුව වර්ගීකරණය කළ ක්‍රීඩා.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M14 20V4M10 20V12M6 20V16"/>
        <path d="M4 21h16"/>
      </svg>
    ),
    label: 'ඇවිදීමේ ක්‍රීඩා',
    desc: 'නිශ්චිත රිද්මයක් සහ විඳදරාගැනීම පරීක්ෂා කෙරෙන දීර්ඝ දුර ඇවිදීමේ ක්‍රීඩා ඉසව්.',
  },
];

function ScoreTrackLogo({ color = 'hsl(210, 98%, 60%)' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8M12 17v4"/><path d="M7 4H4a1 1 0 0 0-1 1v2a5 5 0 0 0 5 5h0"/><path d="M17 4h3a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5h0"/><path d="M6 4h12v7a6 6 0 0 1-12 0V4z"/>
        </svg>
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1.9rem', color, letterSpacing: '-0.015em' }}>
        ක්‍රීඩක ලකුණු පද්ධතිය
      </Typography>
    </Box>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const tag = document.createElement('style');
    tag.innerHTML = globalStyles;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/score-entry');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack
      className="login-page-root"
      direction="row"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'hsl(217, 32%, 17%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {!isMobile && (
        <Box
          sx={{
            flex: '1 1 auto',
            maxWidth: isLarge ? '900px' : '500px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: { md: 4, lg: 8 },
            py: 6,
          }}
        >
          <Box sx={{ mb: 6 }}>
            <ScoreTrackLogo />
          </Box>

          {/* 6 Categories Grid — Splits to 2 columns on Large screens */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isLarge ? '1fr 1fr' : '1fr',
              gap: 3,
            }}
          >
            {categories.map((cat) => (
              <Stack key={cat.label} direction="row" spacing={2} className="category-card" alignItems="flex-start">
                <Box
                  className="icon-container"
                  sx={{
                    flexShrink: 0,
                    mt: '4px',
                    color: 'hsl(210, 85%, 55%)',
                    display: 'flex',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {cat.icon}
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: 'hsl(0, 0%, 98%)',
                      mb: 0.3,
                    }}
                  >
                    {cat.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      color: 'hsl(217, 15%, 65%)',
                      lineHeight: 1.5,
                    }}
                  >
                    {cat.desc}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Box>
      )}

      {/* Right — Login Card */}
      <Box sx={{ flex: '0 0 auto', px: { xs: 3, md: 6 }, py: 6 }}>
        <Box
          sx={{
            width: '100%',
            minWidth: { sm: 400 },
            maxWidth: 440,
            backgroundColor: 'hsl(217, 28%, 23%)',
            borderRadius: '12px',
            border: '1px solid hsl(217, 25%, 32%)',
            px: { xs: 3, sm: 4 },
            py: 5,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          }}
        >
          {isMobile && (
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <ScoreTrackLogo />
            </Box>
          )}

          <Typography sx={{ fontSize: '2.25rem', fontWeight: 700, color: '#fff', mb: 4 }}>
            {t('login')}
          </Typography>

          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', color: 'hsl(217, 20%, 80%)', mb: 1 }}>
              {t('username')}
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: 'hsl(217, 35%, 30%)' } }}
            />

            <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', color: 'hsl(217, 20%, 80%)', mb: 1 }}>
              {t('password')}
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: 'hsl(217, 35%, 30%)' } }}
            />

            <FormControlLabel
              control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} sx={{ color: 'hsl(217, 25%, 50%)' }} />}
              label={<Typography sx={{ fontSize: '0.85rem', color: 'hsl(217, 20%, 70%)' }}>Remember me</Typography>}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, backgroundColor: 'hsl(210, 98%, 48%)', fontWeight: 600 }}
            >
              {loading ? 'Signing in…' : t('login')}
            </Button>
          </form>
        </Box>
      </Box>
    </Stack>
  );
}