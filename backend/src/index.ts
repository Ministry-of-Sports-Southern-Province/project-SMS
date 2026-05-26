import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import sportCategoriesRoutes from './routes/sportCategories';
import eventsRoutes from './routes/events';
import districtsRoutes from './routes/districts';
import dsOfficesRoutes from './routes/dsOffices';
import scoreEntriesRoutes from './routes/scoreEntries';
import adminRoutes from './routes/admin';
import profileRoutes from './routes/profile';

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-vercel-url.vercel.app', // add after Vercel deploy
  'https://sms-app.sportsdpsp.lk',      // add after custom domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/sport-categories', sportCategoriesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/districts', districtsRoutes);
app.use('/api/ds-offices', dsOfficesRoutes);
app.use('/api/score-entries', scoreEntriesRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
