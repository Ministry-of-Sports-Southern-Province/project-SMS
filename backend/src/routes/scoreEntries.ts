import { Router, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import pool from '../db/connection';
import { auth, AuthRequest } from '../middleware/auth';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';

const router = Router();
router.use(auth);

const timeRegex = /^(\d{1,2}\.\d{2}\.\d{2}|\d{1,2}\.\d{2})$/;
const distanceRegex = /^\d+(\.\d+)?m$/;
const pointsRegex = /^\d+(\.\d{1,3})?$/;

function validateRecord(value: string, format: string): boolean {
  if (!value) return true;
  if (format === 'time') return timeRegex.test(value.trim());
  if (format === 'distance') return distanceRegex.test(value.trim());
  if (format === 'points') return pointsRegex.test(value.trim());
  return true;
}

router.get(
  '/',
  [
    query('districtId').optional(),
    query('dsOfficeId').optional(),
    query('gender').optional().isIn(['male', 'female', 'mixed']),
    query('categoryId').optional(),
    query('eventId').optional(),
    query('search').optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    const { districtId, dsOfficeId, gender, categoryId, eventId, search } = req.query;
    let sql = `
      SELECT se.id, se.event_id, se.gender, se.created_at,
             e.name as event_name, e.is_relay, e.players_per_place,
             sc.code as category_code, sc.name as category_name,
             d.name as district_name, do.name as ds_office_name,
             sep.place, sep.player_name, sep.certificate_no, sep.record
      FROM score_entries se
      JOIN events e ON se.event_id = e.id
      JOIN sport_categories sc ON e.sport_category_id = sc.id
      JOIN score_entry_players sep ON se.id = sep.score_entry_id
      JOIN ds_offices do ON sep.ds_office_id = do.id
      JOIN districts d ON do.district_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (districtId) {
      sql += ' AND d.id = ?';
      params.push(districtId);
    }
    if (dsOfficeId) {
      sql += ' AND do.id = ?';
      params.push(dsOfficeId);
    }
    if (gender) {
      sql += ' AND se.gender = ?';
      params.push(gender);
    }
    if (categoryId) {
      sql += ' AND sc.id = ?';
      params.push(categoryId);
    }
    if (eventId) {
      sql += ' AND se.event_id = ?';
      params.push(eventId);
    }
    if (search) {
      sql += ' AND (sep.player_name LIKE ? OR sep.certificate_no LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }

    sql += ' ORDER BY se.created_at DESC, sep.place ASC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  }
);

// Export routes - must be before /:id to avoid matching "export" as id
router.get(
  '/export/xlsx',
  [
    query('districtId').optional(),
    query('dsOfficeId').optional(),
    query('gender').optional(),
    query('categoryId').optional(),
    query('eventId').optional(),
    query('search').optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    const { districtId, dsOfficeId, gender, categoryId, eventId, search } = req.query;
    let sql = `
      SELECT sc.code as Category, e.name as Event, se.gender as Gender, sep.place as Place,
             sep.player_name as "Player Name", sep.certificate_no as "Cert No", d.name as District,
             do.name as "DS Office", sep.record as Record
      FROM score_entries se
      JOIN events e ON se.event_id = e.id
      JOIN sport_categories sc ON e.sport_category_id = sc.id
      JOIN score_entry_players sep ON se.id = sep.score_entry_id
      JOIN ds_offices do ON sep.ds_office_id = do.id
      JOIN districts d ON do.district_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (districtId) { sql += ' AND d.id = ?'; params.push(districtId); }
    if (dsOfficeId) { sql += ' AND do.id = ?'; params.push(dsOfficeId); }
    if (gender) { sql += ' AND se.gender = ?'; params.push(gender); }
    if (categoryId) { sql += ' AND sc.id = ?'; params.push(categoryId); }
    if (eventId) { sql += ' AND se.event_id = ?'; params.push(eventId); }
    if (search) { const s = `%${search}%`; sql += ' AND (sep.player_name LIKE ? OR sep.certificate_no LIKE ?)'; params.push(s, s); }
    sql += ' ORDER BY sc.code, e.name, se.gender, sep.place';
    const [rows] = await pool.execute(sql, params);
    const data = rows as any[];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Score Entries');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=score-entries.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  }
);

router.get(
  '/export/pdf',
  [
    query('districtId').optional(),
    query('dsOfficeId').optional(),
    query('gender').optional(),
    query('categoryId').optional(),
    query('eventId').optional(),
    query('search').optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    const { districtId, dsOfficeId, gender, categoryId, eventId, search } = req.query;
    let sql = `
      SELECT sc.code as cat, e.name as evt, se.gender, sep.place, sep.player_name, sep.certificate_no, d.name as district, do.name as ds_office, sep.record
      FROM score_entries se JOIN events e ON se.event_id = e.id JOIN sport_categories sc ON e.sport_category_id = sc.id
      JOIN score_entry_players sep ON se.id = sep.score_entry_id JOIN ds_offices do ON sep.ds_office_id = do.id JOIN districts d ON do.district_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (districtId) { sql += ' AND d.id = ?'; params.push(districtId); }
    if (dsOfficeId) { sql += ' AND do.id = ?'; params.push(dsOfficeId); }
    if (gender) { sql += ' AND se.gender = ?'; params.push(gender); }
    if (categoryId) { sql += ' AND sc.id = ?'; params.push(categoryId); }
    if (eventId) { sql += ' AND se.event_id = ?'; params.push(eventId); }
    if (search) { const s = `%${search}%`; sql += ' AND (sep.player_name LIKE ? OR sep.certificate_no LIKE ?)'; params.push(s, s); }
    sql += ' ORDER BY sc.code, e.name, se.gender, sep.place';
    const [rows] = await pool.execute(sql, params);
    const data = rows as any[];
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Southern Province - Score Entries', 14, 15);
    (doc as any).autoTable({
      startY: 22,
      head: [['Category', 'Event', 'Gender', 'Place', 'Player', 'Cert No', 'District', 'DS Office', 'Record']],
      body: data.map((r) => [r.cat, r.evt, r.gender, r.place, r.player_name, r.certificate_no, r.district, r.ds_office, r.record || '']),
      styles: { fontSize: 8 },
    });
    const buf = doc.output('arraybuffer');
    res.setHeader('Content-Disposition', 'attachment; filename=score-entries.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(buf));
  }
);

router.get(
  '/:id',
  param('id').isInt(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = req.params.id;
    const [entries] = await pool.execute(
      `SELECT se.id, se.event_id, se.gender, se.created_at, e.name as event_name, e.is_relay, e.players_per_place, e.is_mixed, sc.id as category_id
       FROM score_entries se JOIN events e ON se.event_id = e.id JOIN sport_categories sc ON e.sport_category_id = sc.id WHERE se.id = ?`,
      [id]
    );
    const entryList = entries as any[];
    if (!entryList.length) return res.status(404).json({ error: 'Not found' });
    const [players] = await pool.execute(
      `SELECT sep.id, sep.place, sep.player_name, sep.certificate_no, sep.ds_office_id, sep.record, do.district_id
       FROM score_entry_players sep JOIN ds_offices do ON sep.ds_office_id = do.id WHERE sep.score_entry_id = ? ORDER BY sep.place, sep.id`,
      [id]
    );
    res.json({ ...entryList[0], players: players as any[] });
  }
);

function isPlayerFilled(p: any): boolean {
  return !!(
    p &&
    typeof p.playerName === 'string' && p.playerName.trim() &&
    typeof p.certificateNo === 'string' && p.certificateNo.trim() &&
    p.districtId && p.dsOfficeId
  );
}

router.post(
  '/',
  [
    body('eventId').isInt(),
    body('gender').isIn(['male', 'female', 'mixed']),
    body('players').isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { eventId, gender, players } = req.body;
    const filled = (players as any[]).filter(isPlayerFilled).map((p) => ({
      place: Number(p.place),
      playerName: String(p.playerName).trim(),
      certificateNo: String(p.certificateNo).trim(),
      districtId: Number(p.districtId),
      dsOfficeId: Number(p.dsOfficeId),
      record: p.record ? String(p.record).trim() : null,
    }));

    if (filled.length === 0) {
      return res.status(400).json({ error: 'At least one place must be filled with player name, certificate no, district and DS office' });
    }

    // #region agent log
    try {
      const perPlace: Record<number, number> = {};
      for (const p of filled) perPlace[p.place] = (perPlace[p.place] || 0) + 1;
      const logEntry = JSON.stringify({
        sessionId: '521299',
        runId: 'pre',
        hypothesisId: 'H_backend_filled',
        location: 'scoreEntries.post:filled',
        message: 'Incoming POST /score-entries filled players',
        data: { eventId, gender, filledCount: filled.length, perPlace },
        timestamp: Date.now(),
      });
      fs.appendFileSync('debug-521299.log', logEntry + '\n');
    } catch {
      // ignore logging errors
    }
    // #endregion agent log

    try {
      const [evt] = await pool.execute(
        `SELECT e.is_mixed, e.gender_restriction, erf.format
         FROM events e
         LEFT JOIN event_record_formats erf ON e.id = erf.event_id
         WHERE e.id = ?`,
        [eventId]
      );
      const evtRows = evt as any[];
      const eventInfo = evtRows[0];
      if (!eventInfo) return res.status(400).json({ error: 'Invalid event. Please refresh and try again.' });

      // Enforce gender restrictions for the selected event
      if (eventInfo.is_mixed) {
        if (gender !== 'mixed') return res.status(400).json({ error: 'This event is mixed. Gender must be mixed.' });
      } else {
        if (gender === 'mixed') return res.status(400).json({ error: 'This event is not mixed. Gender must be male or female.' });
        if (eventInfo.gender_restriction === 'male' && gender !== 'male') {
          return res.status(400).json({ error: 'This event is for male only.' });
        }
        if (eventInfo.gender_restriction === 'female' && gender !== 'female') {
          return res.status(400).json({ error: 'This event is for female only.' });
        }
      }

      const recordFormat = eventInfo.format;

      // Only validate record if format is specified (team games have null format)
      if (recordFormat) {
        for (const p of filled) {
          if (p.record && !validateRecord(p.record, recordFormat)) {
            return res.status(400).json({ error: `Invalid record format for ${p.playerName}` });
          }
        }
      }

      const certs = filled.map((p) => p.certificateNo);
      const placeholders = certs.map(() => '?').join(',');
      const [existingCerts] = await pool.execute(
        `SELECT certificate_no FROM score_entry_players WHERE certificate_no IN (${placeholders})`,
        certs
      );
      const existing = (existingCerts as any[]).map((r) => r.certificate_no);
      const duplicates = certs.filter((c) => existing.includes(c));
      if (duplicates.length) {
        // #region agent log
        try {
          const logEntry = JSON.stringify({
            sessionId: '521299',
            runId: 'pre',
            hypothesisId: 'H_backend_dup_cert',
            location: 'scoreEntries.post:duplicateCerts',
            message: 'Duplicate certificate numbers detected',
            data: { eventId, gender, duplicates },
            timestamp: Date.now(),
          });
          fs.appendFileSync('debug-521299.log', logEntry + '\n');
        } catch {
          // ignore logging errors
        }
        // #endregion agent log
        return res.status(400).json({ error: `Duplicate certificate numbers: ${duplicates.join(', ')}` });
      }

      const names = filled.map((p) => p.playerName.toLowerCase());
      if (names.length !== new Set(names).size) {
        // #region agent log
        try {
          const logEntry = JSON.stringify({
            sessionId: '521299',
            runId: 'pre',
            hypothesisId: 'H_backend_dup_name',
            location: 'scoreEntries.post:duplicateNames',
            message: 'Same person appears multiple times in payload',
            data: { eventId, gender, names },
            timestamp: Date.now(),
          });
          fs.appendFileSync('debug-521299.log', logEntry + '\n');
        } catch {
          // ignore logging errors
        }
        // #endregion agent log
        return res.status(400).json({ error: 'Same person cannot win multiple places in the same event' });
      }

      // Check for duplicate places for this event+gender (skip for team games which allow multiple players per place)
      if (recordFormat !== null) {
        const places = filled.map((p) => p.place);
        const placePlaceholders = places.map(() => '?').join(',');
        const [existingPlaces] = await pool.execute(
          `SELECT DISTINCT sep.place
           FROM score_entry_players sep
           JOIN score_entries se ON sep.score_entry_id = se.id
           WHERE se.event_id = ? AND se.gender = ? AND sep.place IN (${placePlaceholders})`,
          [eventId, gender, ...places]
        );
        const existingPlaceNumbers = (existingPlaces as any[]).map((r) => r.place);
        if (existingPlaceNumbers.length > 0) {
          const sortedPlaces = existingPlaceNumbers.sort((a, b) => a - b);
          // #region agent log
          try {
            const logEntry = JSON.stringify({
              sessionId: '521299',
              runId: 'pre',
              hypothesisId: 'H_backend_dup_place',
              location: 'scoreEntries.post:duplicatePlaces',
              message: 'Duplicate places already exist in DB for this event+gender',
              data: { eventId, gender, placesRequested: places, existingPlaceNumbers: sortedPlaces },
              timestamp: Date.now(),
            });
            fs.appendFileSync('debug-521299.log', logEntry + '\n');
          } catch {
            // ignore logging errors
          }
          // #endregion agent log
          return res.status(400).json({
            error: `Place(s) ${sortedPlaces.join(', ')} already have entries for this event and gender. Edit or delete them in View entries.`
          });
        }
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [insertResult] = await conn.execute(
          'INSERT INTO score_entries (event_id, gender, entered_by) VALUES (?, ?, ?)',
          [eventId, gender, req.user!.userId]
        );
        const insertRes = insertResult as any;
        const scoreEntryId = insertRes.insertId;

        for (const p of filled) {
          await conn.execute(
            'INSERT INTO score_entry_players (score_entry_id, place, player_name, certificate_no, ds_office_id, record) VALUES (?, ?, ?, ?, ?, ?)',
            [scoreEntryId, p.place, p.playerName, p.certificateNo, p.dsOfficeId, p.record]
          );
        }
        await conn.commit();
        res.status(201).json({ id: scoreEntryId });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err: any) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ error: 'Invalid event or DS office. Please refresh and try again.' });
      }
      console.error('POST /score-entries', err);
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isInt(),
    body('eventId').isInt(),
    body('gender').isIn(['male', 'female', 'mixed']),
    body('players').isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = req.params.id;
    const { eventId, gender, players } = req.body;

    const filled = (players as any[]).filter(isPlayerFilled).map((p) => ({
      place: Number(p.place),
      playerName: String(p.playerName).trim(),
      certificateNo: String(p.certificateNo).trim(),
      districtId: Number(p.districtId),
      dsOfficeId: Number(p.dsOfficeId),
      record: p.record ? String(p.record).trim() : null,
    }));

    if (filled.length === 0) {
      return res.status(400).json({ error: 'At least one place must be filled with player name, certificate no, district and DS office' });
    }

    try {
      const [evt] = await pool.execute(
        `SELECT e.is_mixed, e.gender_restriction, erf.format
         FROM events e
         LEFT JOIN event_record_formats erf ON e.id = erf.event_id
         WHERE e.id = ?`,
        [eventId]
      );
      const evtRows = evt as any[];
      const eventInfo = evtRows[0];
      if (!eventInfo) return res.status(400).json({ error: 'Invalid event. Please refresh and try again.' });

      // Enforce gender restrictions for the selected event
      if (eventInfo.is_mixed) {
        if (gender !== 'mixed') return res.status(400).json({ error: 'This event is mixed. Gender must be mixed.' });
      } else {
        if (gender === 'mixed') return res.status(400).json({ error: 'This event is not mixed. Gender must be male or female.' });
        if (eventInfo.gender_restriction === 'male' && gender !== 'male') {
          return res.status(400).json({ error: 'This event is for male only.' });
        }
        if (eventInfo.gender_restriction === 'female' && gender !== 'female') {
          return res.status(400).json({ error: 'This event is for female only.' });
        }
      }

      const recordFormat = eventInfo.format;

      // Only validate record if format is specified (team games have null format)
      if (recordFormat) {
        for (const p of filled) {
          if (p.record && !validateRecord(p.record, recordFormat)) {
            return res.status(400).json({ error: `Invalid record format for ${p.playerName}` });
          }
        }
      }

      const certs = filled.map((p) => p.certificateNo);
      const placeholders = certs.map(() => '?').join(',');
      const [existingCerts] = await pool.execute(
        `SELECT certificate_no FROM score_entry_players WHERE score_entry_id != ? AND certificate_no IN (${placeholders})`,
        [id, ...certs]
      );
      const existing = (existingCerts as any[]).map((r) => r.certificate_no);
      const duplicates = certs.filter((c) => existing.includes(c));
      if (duplicates.length) {
        return res.status(400).json({ error: `Duplicate certificate numbers: ${duplicates.join(', ')}` });
      }

      const names = filled.map((p) => p.playerName.toLowerCase());
      if (names.length !== new Set(names).size) {
        return res.status(400).json({ error: 'Same person cannot win multiple places in the same event' });
      }

      // Check for duplicate places for this event+gender in other entries (skip for team games which allow multiple players per place)
      if (recordFormat !== null) {
        const places = filled.map((p) => p.place);
        const placePlaceholders = places.map(() => '?').join(',');
        const [existingPlaces] = await pool.execute(
          `SELECT DISTINCT sep.place
           FROM score_entry_players sep
           JOIN score_entries se ON sep.score_entry_id = se.id
           WHERE se.event_id = ? AND se.gender = ? AND se.id != ? AND sep.place IN (${placePlaceholders})`,
          [eventId, gender, id, ...places]
        );
        const existingPlaceNumbers = (existingPlaces as any[]).map((r) => r.place);
        if (existingPlaceNumbers.length > 0) {
          const sortedPlaces = existingPlaceNumbers.sort((a, b) => a - b);
          return res.status(400).json({
            error: `Place(s) ${sortedPlaces.join(', ')} already exist for this event and gender in another entry.`
          });
        }
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.execute('UPDATE score_entries SET event_id = ?, gender = ? WHERE id = ?', [eventId, gender, id]);
        await conn.execute('DELETE FROM score_entry_players WHERE score_entry_id = ?', [id]);
        for (const p of filled) {
          await conn.execute(
            'INSERT INTO score_entry_players (score_entry_id, place, player_name, certificate_no, ds_office_id, record) VALUES (?, ?, ?, ?, ?, ?)',
            [id, p.place, p.playerName, p.certificateNo, p.dsOfficeId, p.record]
          );
        }
        await conn.commit();
        res.json({ ok: true });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err: any) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ error: 'Invalid event or DS office. Please refresh and try again.' });
      }
      console.error('PUT /score-entries/:id', err);
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

router.delete(
  '/:id',
  param('id').isInt(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = req.params.id;
    const [result] = await pool.execute('DELETE FROM score_entries WHERE id = ?', [id]);
    const r = result as any;
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  }
);

export default router;
