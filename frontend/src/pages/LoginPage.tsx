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
  Link,
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
  ::-webkit-scrollbar-thumb:hover {
    background: hsla(210, 20%, 50%, 0.5);
  }
`;

// ─── Sport categories (replacing MUI's 4 feature items) ──────────────────────
const categories = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2"/><path d="M12 7v5l3 3"/><path d="M6.5 17.5c1-2 3-3.5 5.5-3.5s4.5 1.5 5.5 3.5"/>
        <line x1="8" y1="21" x2="8.5" y2="17.5"/><line x1="16" y1="21" x2="15.5" y2="17.5"/>
      </svg>
    ),
    label: 'Athletic',
    desc: 'Track & field events, sprints, hurdles and multi-discipline competitions.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12c0-4 3-7 8-7s8 3 8 7"/><path d="M4 12c1-1 2-1.5 4-1s3 2 4 2 3-1.5 4-2"/>
        <path d="M12 19v-7"/><circle cx="12" cy="20" r="1"/>
      </svg>
    ),
    label: 'Swimming',
    desc: 'Pool and open-water races across all strokes and distances.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2"/><path d="M9 22V12l-3-4h12l-3 4v10"/><path d="M6 8l-2 3"/><path d="M18 8l2 3"/>
      </svg>
    ),
    label: 'Gymnastics',
    desc: 'Artistic, rhythmic and acrobatic disciplines scored by judges.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 3c0 0-4 4-4 9s4 9 4 9"/><path d="M12 3c0 0 4 4 4 9s-4 9-4 9"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
      </svg>
    ),
    label: 'Team Games',
    desc: 'Football, basketball, volleyball and all collective sport formats.',
  },
];

// ─── ScoreTrack logo ─────────────────────────────────────────────────────────
function ScoreTrackLogo({ color = 'hsl(210, 98%, 60%)' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <Box
        sx={{
          color,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8M12 17v4"/>
          <path d="M7 4H4a1 1 0 0 0-1 1v2a5 5 0 0 0 5 5h0"/>
          <path d="M17 4h3a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5h0"/>
          <path d="M6 4h12v7a6 6 0 0 1-12 0V4z"/>
        </svg>
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '1.1rem',
          color,
          letterSpacing: '-0.015em',
          fontFamily: 'inherit',
        }}
      >
        Player Score System
      </Typography>
      
    </Box>
    
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
      {/* ═══════════════════════════════════════
          LEFT — Features panel (desktop only)
          ═══════════════════════════════════════ */}
      {!isMobile && (
        <Box
          sx={{
            flex: '0 0 auto',
            width: {md: '400px', lg: '480px'},
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pl: { md: 4, lg: 6 },
            pr: { md: 6, lg: 8 },
            py: 6,
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 6 }}>
            <ScoreTrackLogo />
          </Box>

          {/* Features list */}
          <Stack spacing={4}>
            {categories.map((cat) => (
              <Stack key={cat.label} direction="row" spacing={2.5} alignItems="flex-start">
                {/* Icon */}
                <Box
                  sx={{
                    flexShrink: 0,
                    mt: '3px',
                    color: 'hsl(210, 85%, 55%)',
                    opacity: 0.9,
                    display: 'flex',
                  }}
                >
                  {cat.icon}
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: 'hsl(0, 0%, 98%)',
                      mb: 0.5,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {cat.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: 'hsl(217, 15%, 65%)',
                      lineHeight: 1.6,
                      maxWidth: 380,
                    }}
                  >
                    {cat.desc}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {/* ═══════════════════════════════════════
          RIGHT — Dark Material sign-in card
          ═══════════════════════════════════════ */}
      <Box
        sx={{
          flex: '0 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 4, md: 6 },
          py: 6,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: 'hsl(217, 28%, 23%)',
            borderRadius: '8px',
            border: '1px solid hsl(217, 25%, 32%)',
            px: { xs: 3, sm: 4 },
            py: 5,
          }}
        >
          {/* Mobile logo */}
          {isMobile && (
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <ScoreTrackLogo color="hsl(210, 98%, 60%)" />
            </Box>
          )}

          {/* Title */}
          <Typography
            sx={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: 'hsl(0, 0%, 100%)',
              letterSpacing: '-0.02em',
              mb: 4,
              lineHeight: 1.2,
            }}
          >
            {t('login')}
          </Typography>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: '6px', 
                  fontSize: '0.85rem',
                  backgroundColor: 'hsla(0, 100%, 50%, 0.15)',
                  color: 'hsl(0, 100%, 75%)',
                  border: '1px solid hsla(0, 100%, 50%, 0.3)',
                  '& .MuiAlert-icon': {
                    color: 'hsl(0, 100%, 75%)',
                  }
                }}
              >
                {error}
              </Alert>
            )}

            {/* Username field */}
            <Typography
              component="label"
              htmlFor="username"
              sx={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'hsl(217, 20%, 80%)',
                mb: 0.8,
                textTransform: 'capitalize',
              }}
            >
              {t('username')}
            </Typography>
            <TextField
              id="username"
              fullWidth
              placeholder="Deepika"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              size="small"
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  backgroundColor: 'hsl(217, 35%, 30%)',
                  fontSize: '0.9rem',
                  color: 'hsl(0, 0%, 100%)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'hsl(217, 35%, 32%)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'hsl(217, 35%, 30%)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'hsl(210, 98%, 48%)',
                    borderWidth: '2px',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'hsl(217, 25%, 38%)',
                  transition: 'border-color 0.2s ease',
                },
                '& .MuiOutlinedInput-input': {
                  color: 'hsl(0, 0%, 100%)',
                  '&::placeholder': {
                    color: 'hsl(217, 20%, 55%)',
                    opacity: 0.8,
                  },
                },
              }}
            />

            {/* Password field */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
              <Typography
                component="label"
                htmlFor="password"
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'hsl(217, 20%, 80%)',
                  textTransform: 'capitalize',
                }}
              >
                {t('password')}
              </Typography>
           
            </Box>
            <TextField
              id="password"
              fullWidth
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  backgroundColor: 'hsl(217, 35%, 30%)',
                  fontSize: '0.9rem',
                  color: 'hsl(0, 0%, 100%)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'hsl(217, 35%, 32%)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'hsl(217, 35%, 30%)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'hsl(210, 98%, 48%)',
                    borderWidth: '2px',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'hsl(217, 25%, 38%)',
                  transition: 'border-color 0.2s ease',
                },
                '& .MuiOutlinedInput-input': {
                  color: 'hsl(0, 0%, 100%)',
                  '&::placeholder': {
                    color: 'hsl(217, 20%, 55%)',
                    opacity: 0.8,
                  },
                },
              }}
            />

            {/* Remember me checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  sx={{
                    color: 'hsl(217, 25%, 50%)',
                    '&.Mui-checked': {
                      color: 'hsl(210, 98%, 60%)',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.85rem', color: 'hsl(217, 20%, 70%)' }}>
                  Remember me
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            {/* Sign in button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.4,
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.3px',
                backgroundColor: 'hsl(210, 98%, 48%)',
                color: '#fff',
                boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'hsl(210, 98%, 42%)',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'hsl(210, 60%, 50%)',
                  color: 'hsl(217, 20%, 70%)',
                },
              }}
            >
              {loading ? 'Signing in…' : t('login')}
            </Button>
          </form>


          {/* Sign up link */}
         
        </Box>
      </Box>
    </Stack>
  );
}