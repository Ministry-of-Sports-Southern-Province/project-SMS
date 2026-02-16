import { Box, Card, CardContent, TextField, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface PlayerInput {
  place: number;
  playerName: string;
  certificateNo: string;
  districtId: number;
  dsOfficeId: number;
  record: string;
}

interface PlayerCardsProps {
  players: PlayerInput[];
  onChange: (players: PlayerInput[]) => void;
  districts: { id: number; name: string }[];
  dsOfficesByDistrict: Record<number, { id: number; name: string }[]>;
  isRelay: boolean;
  recordFormat: 'time' | 'distance';
  recordLabel: string;
}

export default function PlayerCards({
  players,
  onChange,
  districts,
  dsOfficesByDistrict,
  isRelay,
  recordFormat,
  recordLabel,
}: PlayerCardsProps) {
  const { t } = useTranslation();

  const updatePlayer = (index: number, field: keyof PlayerInput, value: string | number) => {
    const next = players.map((p, i) => {
      if (i !== index) return p;
      const updated = { ...p, [field]: value };
      if (field === 'districtId') updated.dsOfficeId = 0;
      return updated;
    });
    onChange(next);
  };

  const placeLabels: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };

  return (
    <Grid container spacing={2}>
      {players.map((p, i) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                {t('place')} {placeLabels[p.place] || p.place}
                {isRelay && ` - Player ${(i % 4) + 1}`}
              </Box>
              <TextField
                fullWidth
                size="small"
                label={t('playerName')}
                value={p.playerName}
                onChange={(e) => updatePlayer(i, 'playerName', e.target.value)}
                required
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                label={t('certNo')}
                value={p.certificateNo}
                onChange={(e) => updatePlayer(i, 'certificateNo', e.target.value)}
                required
                sx={{ mb: 1 }}
              />
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>{t('district')}</InputLabel>
                <Select
                  value={p.districtId || ''}
                  label={t('district')}
                  onChange={(e) => updatePlayer(i, 'districtId', Number(e.target.value))}
                  required
                >
                  {districts.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>{t('dsOffice')}</InputLabel>
                <Select
                  value={p.dsOfficeId || ''}
                  label={t('dsOffice')}
                  onChange={(e) => updatePlayer(i, 'dsOfficeId', Number(e.target.value))}
                  required
                  disabled={!p.districtId}
                >
                  {(dsOfficesByDistrict[p.districtId] || []).map((ds) => (
                    <MenuItem key={ds.id} value={ds.id}>{ds.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                size="small"
                label={recordLabel}
                value={p.record}
                onChange={(e) => updatePlayer(i, 'record', e.target.value)}
                placeholder={recordFormat === 'time' ? 'e.g. 12.05 or 1.13.12' : 'e.g. 12m or 40.34m'}
                sx={{ mb: 0 }}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
