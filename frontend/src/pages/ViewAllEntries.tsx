import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit, Delete, FileDownload, Refresh} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { api, apiBlob } from '../api/client';
import PlayerCards, { PlayerInput } from '../components/PlayerCards';

interface EntryRow {
  id: number;
  event_id: number;
  gender: string;
  created_at: string;
  event_name: string;
  category_code: string;
  category_name: string;
  district_name: string;
  ds_office_name: string;
  place: number;
  player_name: string;
  certificate_no: string;
  record: string;
}

interface EntryDetail {
  id: number;
  event_id: number;
  gender: string;
  event_name: string;
  is_relay: boolean;
  players_per_place: number;
  places_count?: number;
  is_mixed: boolean;
  category_id: number;
  players: { id: number; place: number; player_name: string; certificate_no: string; ds_office_id: number; district_id: number; record: string }[];
}

export default function ViewAllEntries() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [categories, setCategories] = useState<{ id: number; code: string; name: string }[]>([]);
  const [events, setEvents] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [dsOffices, setDsOffices] = useState<{ id: number; district_id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({
    districtId: '',
    dsOfficeId: '',
    gender: '',
    categoryId: '',
    eventId: '',
    search: '',
  });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [entryDetail, setEntryDetail] = useState<EntryDetail | null>(null);
  const [editPlayers, setEditPlayers] = useState<PlayerInput[]>([]);
  const [editEventId, setEditEventId] = useState(0);
  const [editGender, setEditGender] = useState<'male' | 'female' | 'mixed'>('male');

  const loadRows = () => {
    const params = new URLSearchParams();

    if (filters.districtId) params.set('districtId', filters.districtId);
    if (filters.dsOfficeId) params.set('dsOfficeId', filters.dsOfficeId);
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.eventId) params.set('eventId', filters.eventId);
    if (filters.search) params.set('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `/score-entries?${queryString}` : '/score-entries';
    api<EntryRow[]>(url).then(setRows).catch(console.error);
  };

  const handleClearFilters = () => {
    setFilters({
      districtId: '',
      dsOfficeId: '',
      gender: '',
      categoryId: '',
      eventId: '',
      search: '',
    });
  };

  useEffect(() => {
    loadRows();
  }, [filters]);

  useEffect(() => {
    api<{ id: number; code: string; name: string }[]>('/sport-categories').then(setCategories).catch(console.error);
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
    if (filters.categoryId) {
      api<{ id: number; name: string }[]>(`/events?categoryId=${filters.categoryId}`).then(setEvents).catch(console.error);
    } else {
      setEvents([]);
    }
  }, [filters.categoryId]);

  const dsOfficesByDistrict: Record<number, { id: number; name: string }[]> = districts.reduce(
    (acc, d) => {
      acc[d.id] = dsOffices.filter((ds) => ds.district_id === d.id).map((ds) => ({ id: ds.id, name: ds.name }));
      return acc;
    },
    {} as Record<number, { id: number; name: string }[]>
  );

  const [editEvents, setEditEvents] = useState<{ id: number; name: string; players_per_place?: number; places_count?: number; record_format?: 'time' | 'distance' | 'points' | null }[]>([]);

  const openEdit = async (id: number) => {
    setSelectedEntryId(id);
    const detail = await api<EntryDetail>(`/score-entries/${id}`);
    setEntryDetail(detail);
    setEditEventId(detail.event_id);
    setEditGender(detail.gender as 'male' | 'female' | 'mixed');
    setEditPlayers(
      detail.players.map((p) => ({
        place: p.place,
        playerName: p.player_name,
        certificateNo: p.certificate_no,
        districtId: p.district_id,
        dsOfficeId: p.ds_office_id,
        record: p.record || '',
      }))
    );
    api<{ id: number; name: string; players_per_place?: number; places_count?: number; record_format?: 'time' | 'distance' | 'points' | null }[]>(`/events?categoryId=${detail.category_id}`)
      .then(setEditEvents)
      .catch(() => []);
    setEditOpen(true);
  };

  const openDelete = (id: number) => {
    setSelectedEntryId(id);
    setDeleteOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedEntryId) return;
    try {
      await api(`/score-entries/${selectedEntryId}`, {
        method: 'PUT',
        body: JSON.stringify({
          eventId: editEventId,
          gender: editGender,
          players: editPlayers.map((p) => ({
            place: p.place,
            playerName: p.playerName,
            certificateNo: p.certificateNo,
            districtId: p.districtId,
            dsOfficeId: p.dsOfficeId,
            record: p.record || undefined,
          })),
        }),
      });
      setEditOpen(false);
      loadRows();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!selectedEntryId) return;
    try {
      await api(`/score-entries/${selectedEntryId}`, { method: 'DELETE' });
      setDeleteOpen(false);
      setSelectedEntryId(null);
      loadRows();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    const params: Record<string, string> = {};
    if (filters.districtId) params.districtId = filters.districtId;
    if (filters.dsOfficeId) params.dsOfficeId = filters.dsOfficeId;
    if (filters.gender) params.gender = filters.gender;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.eventId) params.eventId = filters.eventId;
    if (filters.search) params.search = filters.search;
    const qs = new URLSearchParams(params).toString();
    const blob = await apiBlob(`/score-entries/export/${format}?${qs}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `score-entries.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedRows = [...rows].sort((a, b) => (b.created_at > a.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));

  const groupedRows = sortedRows.map((r, i) => ({ ...r, rowKey: `${r.id}-${i}-${r.certificate_no}` }));

  const selectedEntry = entryDetail;
  const editEvent = editEvents.find((e) => e.id === editEventId);
  const playersPerPlace = editEvent?.players_per_place ?? selectedEntry?.players_per_place ?? 1;
  const recordFormat = editEvent?.record_format ?? null;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('viewAllEntries')}
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label={t('search')}
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            sx={{ minWidth: 150 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('district')}</InputLabel>
            <Select
              value={filters.districtId}
              label={t('district')}
              onChange={(e) => setFilters((f) => ({ ...f, districtId: e.target.value, dsOfficeId: '' }))}
            >
              <MenuItem value="">All</MenuItem>
              {districts.map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('dsOffice')}</InputLabel>
            <Select
              value={filters.dsOfficeId}
              label={t('dsOffice')}
              onChange={(e) => setFilters((f) => ({ ...f, dsOfficeId: e.target.value }))}
              disabled={!filters.districtId}
            >
              <MenuItem value="">All</MenuItem>
              {(dsOfficesByDistrict[Number(filters.districtId)] || []).map((ds) => (
                <MenuItem key={ds.id} value={String(ds.id)}>{ds.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>{t('gender')}</InputLabel>
            <Select value={filters.gender} label={t('gender')} onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="male">{t('male')}</MenuItem>
              <MenuItem value="female">{t('female')}</MenuItem>
              <MenuItem value="mixed">{t('mixed')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('category')}</InputLabel>
            <Select value={filters.categoryId} label={t('category')} onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value, eventId: '' }))}>
              <MenuItem value="">All</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.code}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('event')}</InputLabel>
            <Select value={filters.eventId} label={t('event')} onChange={(e) => setFilters((f) => ({ ...f, eventId: e.target.value }))} disabled={!filters.categoryId}>
              <MenuItem value="">All</MenuItem>
              {events.map((e) => (
                <MenuItem key={e.id} value={String(e.id)}>{t(e.name)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton 
                  onClick={handleClearFilters} 
                  size="small" 
                  color="primary"
                  title={t('Refresh')}
                >
                  <Refresh />
                </IconButton>
          <Button startIcon={<FileDownload />} size="small" onClick={() => handleExport('xlsx')}>
            {t('exportExcel')}
          </Button>
          <Button startIcon={<FileDownload />} size="small" onClick={() => handleExport('pdf')}>
            {t('exportPdf')}
          </Button>
        </Box>
      </Paper>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>{t('category')}</TableCell>
              <TableCell>{t('event')}</TableCell>
              <TableCell>{t('gender')}</TableCell>
              <TableCell>{t('place')}</TableCell>
              <TableCell>{t('playerName')}</TableCell>
              <TableCell>{t('certNo')}</TableCell>
              <TableCell>{t('district')}</TableCell>
              <TableCell>{t('dsOffice')}</TableCell>
              <TableCell>{t('record')}</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupedRows.map((r) => (
              <TableRow key={r.rowKey}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.category_code}</TableCell>
                <TableCell>{t(r.event_name)}</TableCell>
                <TableCell>{t(r.gender)}</TableCell>
                <TableCell>{r.place}</TableCell>
                <TableCell>{r.player_name}</TableCell>
                <TableCell>{r.certificate_no}</TableCell>
                <TableCell>{r.district_name}</TableCell>
                <TableCell>{r.ds_office_name}</TableCell>
                <TableCell>{r.record}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(r.id)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => openDelete(r.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('edit')}</DialogTitle>
        <DialogContent>
          {entryDetail && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('event')}</InputLabel>
                <Select value={editEventId} label={t('event')} onChange={(e) => setEditEventId(Number(e.target.value))}>
                  {editEvents.map((e) => (
                    <MenuItem key={e.id} value={e.id}>{t(e.name)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('gender')}</InputLabel>
                <Select value={editGender} label={t('gender')} onChange={(e) => setEditGender(e.target.value as 'male' | 'female' | 'mixed')}>
                  <MenuItem value="male">{t('male')}</MenuItem>
                  <MenuItem value="female">{t('female')}</MenuItem>
                  <MenuItem value="mixed">{t('mixed')}</MenuItem>
                </Select>
              </FormControl>
              <PlayerCards
                players={editPlayers}
                onChange={setEditPlayers}
                districts={districts}
                dsOfficesByDistrict={dsOfficesByDistrict}
                playersPerPlace={playersPerPlace}
                recordFormat={recordFormat}
                recordLabel={recordFormat ? t('record') : ''}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleEditSave}>
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t('confirmDelete')}</DialogTitle>
        <DialogContent>Are you sure you want to delete this entry?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
