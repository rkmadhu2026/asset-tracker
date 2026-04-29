import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import clientsRouter          from './routes/clients.js';
import sitesRouter            from './routes/sites.js';
import racksRouter            from './routes/racks.js';
import infrastructureRouter   from './routes/infrastructure.js';
import usersRouter            from './routes/users.js';
import assetsRouter           from './routes/assets.js';
import configTasksRouter      from './routes/config-tasks.js';
import deviceTemplatesRouter  from './routes/device-templates.js';
import driftsRouter           from './routes/drifts.js';
import validationHistoryRouter from './routes/validation-history.js';

const app  = express();
const PORT = Number(process.env.API_PORT) || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/api/clients',            clientsRouter);
app.use('/api/sites',              sitesRouter);
app.use('/api/racks',              racksRouter);
app.use('/api/infrastructure',     infrastructureRouter);
app.use('/api/users',              usersRouter);
app.use('/api/assets',             assetsRouter);
app.use('/api/config-tasks',       configTasksRouter);
app.use('/api/device-templates',   deviceTemplatesRouter);
app.use('/api/drifts',             driftsRouter);
app.use('/api/validation-history', validationHistoryRouter);

// Global error handler — keeps the server alive on unhandled route errors.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Argus API running on http://localhost:${PORT}`);
});
