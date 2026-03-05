import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import PlayerCards, { PlayerInput } from '../components/PlayerCards';
import {Refresh } from '@mui/icons-material';

interface Category {
  id: number;
  code: string;
  name: string;
}

interface Event {
  id: number;
  name: string;
  is_relay: boolean;
  players_per_place: number;
  is_mixed: boolean;
  gender_restriction?: 'male' | 'female' | 'both' | 'mixed';
  places_count?: number;
  record_format?: 'time' | 'distance' | 'points' | null;
}

const timeRegex = /^(\d{1,2}\.\d{2}\.\d{2}|\d{1,2}\.\d{2})$/;
const distanceRegex = /^\d+(\.\d+)?m$/;
const pointsRegex = /^\d+(\.\d{1,3})?$/;

function validateRecord(value: string, format: 'time' | 'distance' | 'points'): boolean {
  if (!value.trim()) return true;
  if (format === 'time') return timeRegex.test(value.trim());
  if (format === 'distance') return distanceRegex.test(value.trim());
  return pointsRegex.test(value.trim());
}

function createEmptyPlayers(placesCount: number, playersPerPlace: number): PlayerInput[] {
  const totalSlots = placesCount * playersPerPlace;
  const result: PlayerInput[] = [];
  for (let i = 0; i < totalSlots; i++) {
    const place = Math.floor(i / playersPerPlace) + 1;
    result.push({
      place,
      playerName: '',
      certificateNo: '',
      districtId: 0,
      dsOfficeId: 0,
      record: '',
    });
  }
 
  return result;
}

export default function ScoreEntryForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [dsOffices, setDsOffices] = useState<{ id: number; district_id: number; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [eventId, setEventId] = useState<number>(0);
  const [gender, setGender] = useState<'male' | 'female' | 'mixed'>('male');
  const [players, setPlayers] = useState<PlayerInput[]>(createEmptyPlayers(3, 1));
  const [success, setSuccess] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const selectedEvent = events.find((e) => e.id === eventId);
  const isRelay = selectedEvent?.is_relay ?? false;
  const isMixed = selectedEvent?.is_mixed ?? false;
  const placesCount = selectedEvent?.places_count ?? 3;
  const playersPerPlace = selectedEvent?.players_per_place ?? 1;
  const recordFormat = selectedEvent?.record_format ?? null;

  const visibleEvents = events.filter((e) => {
    if (e.is_mixed) return true;
    if (gender === 'mixed') return false;
    const r = e.gender_restriction || 'both';
    if (r === 'both') return true;
    if (r === 'male') return gender === 'male';
    if (r === 'female') return gender === 'female';
    return true;
  });

  useEffect(() => {
    api<Category[]>('/sport-categories').then((cats) => {
      setCategories(cats);
      if (cats.length && !categoryId) setCategoryId(cats[0]!.id);
    }).catch(console.error);
    api<{ id: number; name: string }[]>('/districts').then(setDistricts).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [d1, d2, d3] = await Promise.all([
        api<{ id: number; district_id: number; name: string }[]>('/ds-offices?districtId=1').catch(() => []),
        api<{ id: number; district_id: number; name: string }[]>('/ds-offices?districtId=2').catch(() => []),
        api<{ id: number; district_id: number; name: string }[]>('/ds-offices?districtId=3').catch(() => []),
      ]);
      setDsOffices([...d1, ...d2, ...d3]);
    };
    load();
  }, []);

  useEffect(() => {
    if (categoryId) {
      api<Event[]>(`/events?categoryId=${categoryId}`).then(setEvents).catch(console.error);
    } else {
      setEvents([]);
    }
  }, [categoryId]);

  useEffect(() => {
    setEventId(0);
    setGender('male');
  }, [categoryId]);

  useEffect(() => {
    if (eventId && !visibleEvents.some((e) => e.id === eventId)) {
      setEventId(0);
    }
  }, [eventId, gender, events]);

  useEffect(() => {
    if (isMixed) {
      setGender('mixed');
    } else if (gender === 'mixed') {
      setGender('male');
    }
  }, [eventId, isMixed]);

  useEffect(() => {
    setPlayers(createEmptyPlayers(placesCount, playersPerPlace));
  }, [eventId, placesCount, playersPerPlace]);

  const dsOfficesByDistrict: Record<number, { id: number; name: string }[]> = districts.reduce(
    (acc, d) => {
      acc[d.id] = dsOffices.filter((ds) => ds.district_id === d.id).map((ds) => ({ id: ds.id, name: ds.name }));
      return acc;
    },
    {} as Record<number, { id: number; name: string }[]>
  );

  const isPlayerFilled = (p: PlayerInput) =>
    !!(p.playerName?.trim() && p.certificateNo?.trim() && p.districtId && p.dsOfficeId);

  const getFilledPlayers = () =>
    players.filter(isPlayerFilled).map((p) => ({
      place: p.place,
      playerName: p.playerName.trim(),
      certificateNo: p.certificateNo.trim(),
      districtId: p.districtId,
      dsOfficeId: p.dsOfficeId,
      record: p.record?.trim() || undefined,
    }));

  const validate = (): string | null => {
    const filled = getFilledPlayers();
    if (filled.length === 0) {
      return t('required') + ': ' + t('playerName') + ', ' + t('certNo') + ', ' + t('district') + ', ' + t('dsOffice') + ' (at least one place)';
    }
    // Only validate record if format is specified (team games have null format)
    if (recordFormat) {
      for (const p of filled) {
        if (p.record && !validateRecord(p.record, recordFormat)) return t('invalidRecord');
      }
    }

    // #region agent log
    try {
      const perPlace: Record<number, number> = {};
      for (const p of filled) perPlace[p.place] = (perPlace[p.place] || 0) + 1;
      fetch('http://127.0.0.1:7243/ingest/16d23f38-11c3-48ce-8271-621ee55c36ff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '521299' },
        body: JSON.stringify({
          sessionId: '521299',
          runId: 'pre',
          hypothesisId: 'H_validate_counts',
          location: 'ScoreEntryForm.tsx:validate',
          message: 'Validate filled players per place',
          data: { eventId, gender, placesCount, playersPerPlace, filledCount: filled.length, perPlace },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch { /* ignore */ }
    // #endregion agent log

    const names = filled.map((p) => p.playerName.toLowerCase());
    if (new Set(names).size !== names.length) return t('noDuplicatePerson');
    return null;
  };

  const handleSubmit = async (toPreview: boolean) => {
    setError('');
    // #region agent log
    try {
      fetch('http://127.0.0.1:7243/ingest/16d23f38-11c3-48ce-8271-621ee55c36ff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '521299' },
        body: JSON.stringify({
          sessionId: '521299',
          runId: 'pre',
          hypothesisId: 'H_submit_state',
          location: 'ScoreEntryForm.tsx:handleSubmit',
          message: 'Submit clicked (before validate)',
          data: { toPreview, categoryId, eventId, gender, placesCount, playersPerPlace, recordFormat },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch { /* ignore */ }
    // #endregion agent log

    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const filled = getFilledPlayers();
    if (toPreview) {
      setShowPreview(true);
      return;
    }
    try {
      const payload = {
        eventId,
        gender,
        players: filled,
      };
      // #region agent log
      try {
        const perPlace: Record<number, number> = {};
        for (const p of filled) perPlace[p.place] = (perPlace[p.place] || 0) + 1;
        fetch('http://127.0.0.1:7243/ingest/16d23f38-11c3-48ce-8271-621ee55c36ff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '521299' },
          body: JSON.stringify({
            sessionId: '521299',
            runId: 'pre',
            hypothesisId: 'H_payload_shape',
            location: 'ScoreEntryForm.tsx:handleSubmit',
            message: 'Payload about to POST /score-entries',
            data: { eventId, gender, filledCount: filled.length, perPlace },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      } catch { /* ignore */ }
      // #endregion agent log

      const res = await api<{ id: number }>('/score-entries', { method: 'POST', body: JSON.stringify(payload) });
      setSavedId(res.id);
      setSuccess(true);
    } catch (err) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7243/ingest/16d23f38-11c3-48ce-8271-621ee55c36ff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '521299' },
          body: JSON.stringify({
            sessionId: '521299',
            runId: 'pre',
            hypothesisId: 'H_api_error',
            location: 'ScoreEntryForm.tsx:handleSubmit',
            message: 'POST /score-entries failed',
            data: { eventId, gender, error: err instanceof Error ? err.message : String(err) },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      } catch { /* ignore */ }
      // #endregion agent log
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleAddAnother = () => {
    setSuccess(false);
    setSavedId(null);
    setShowPreview(false);
    setPlayers(createEmptyPlayers(placesCount, playersPerPlace));
    setError('');
  };

  const handleViewAll = () => {
    navigate('/view-entries');
  };

  const handleClear = () => {
    setCategoryId(categories.length > 0 ? categories[0].id : 0);
    setEventId(0);
    setGender('male');
    setPlayers(createEmptyPlayers(3, 1));
    setError('');
    setSuccess(false);
    setSavedId(null);
    setShowPreview(false);
  };

  const cat = categories.find((c) => c.id === categoryId);
  const evt = events.find((e) => e.id === eventId);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('scoreEntry')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          {t('category')} / {t('event')} / {t('gender')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>{t('category')}</InputLabel>
            <Select value={categoryId} label={t('category')} onChange={(e) => setCategoryId(Number(e.target.value))}>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.code} - {t(c.name)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>{t('event')}</InputLabel>
            <Select value={eventId} label={t('event')} onChange={(e) => setEventId(Number(e.target.value))} disabled={!categoryId}>
              {visibleEvents.map((e) => (
                <MenuItem key={e.id} value={e.id}>{t(e.name)}</MenuItem>
              ))}
            </Select>
          </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>{t('gender')}</InputLabel>
              <Select value={gender} label={t('gender')} onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'mixed')} disabled={isMixed}>
                {isMixed ? (
                  <MenuItem value="mixed">{t('mixed')}</MenuItem>
                ) : (
                  [
                    <MenuItem key="male" value="male">{t('male')}</MenuItem>,
                    <MenuItem key="female" value="female">{t('female')}</MenuItem>,
                  ]
                )}
              </Select>
            </FormControl>
           <IconButton 
                  onClick={handleClear} 
                  size="small" 
                  color="primary"
                  title={t('Refresh')}
                >
                  <Refresh />
                </IconButton>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {eventId && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            {t('playerName')} / {t('certNo')} / {t('district')} / {t('dsOffice')} / {t('record')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('fillAtLeastOne')}
          </Typography>
          <PlayerCards
            players={players}
            onChange={setPlayers}
            districts={districts}
            dsOfficesByDistrict={dsOfficesByDistrict}
            playersPerPlace={playersPerPlace}
            recordFormat={recordFormat}
            recordLabel={
              recordFormat
                ? t('record') +
                  (recordFormat === 'time'
                    ? ' (e.g. 12.05, 1.13.12)'
                    : recordFormat === 'distance'
                      ? ' (e.g. 12m, 40.34m)'
                      : ' (e.g. 13.500)')
                : t('record')
            }
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => handleSubmit(true)}>
              {t('preview')}
            </Button>
            <Button variant="contained" onClick={() => handleSubmit(false)}>
              {t('submit')}
            </Button>
          </Box>
        </Paper>
      )}

      {showPreview && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>{t('preview')}</Typography>
          <Typography>{t('category')}: {cat?.code} - {cat ? t(cat.name) : ''}</Typography>
          <Typography>{t('event')}: {evt ? t(evt.name) : ''}, {t('gender')}: {t(gender)}</Typography>
          <Typography variant="body2" color="text.secondary">Places to be saved: {getFilledPlayers().length}</Typography>
          {getFilledPlayers().slice(0, 8).map((p, i) => (
            <Typography key={i} variant="body2">{p.place}: {p.playerName} - {p.certificateNo}</Typography>
          ))}
          {getFilledPlayers().length > 8 && <Typography variant="body2">... +{getFilledPlayers().length - 8} more</Typography>}
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => handleSubmit(false)}>{t('submit')}</Button>
            <Button sx={{ ml: 2 }} onClick={() => setShowPreview(false)}>{t('cancel')}</Button>
          </Box>
        </Paper>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('entrySaved')} (ID: {savedId})
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" size="small" onClick={handleAddAnother}>
              {t('addAnother')}
            </Button>
            <Button variant="outlined" size="small" onClick={handleViewAll}>
              {t('viewAll')}
            </Button>
          </Box>
        </Alert>
      )}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} message={error} />
    </Box>
  );
}
