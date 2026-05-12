import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

import authRouter             from './routes/auth.js';
import uploadRouter           from './routes/upload.js';
import chatsRouter            from './routes/chats.js';
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
import auditLogsRouter         from './routes/audit-logs.js';
import documentTemplatesRouter from './routes/document-templates.js';
import documentsRouter         from './routes/documents.js';

const app  = express();
const PORT = Number(process.env.API_PORT) || 4000;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';

const corsOriginMatcher =
  corsOrigin === '*'
    ? true
    : corsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

app.use(cors({
  origin: corsOriginMatcher,
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api/auth',              authRouter);
app.use('/api/upload',            uploadRouter);
app.use('/api/chats',             chatsRouter);
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
app.use('/api/audit-logs',         auditLogsRouter);
app.use('/api/document-templates', documentTemplatesRouter);
app.use('/api/documents',          documentsRouter);

// Global error handler — keeps the server alive on unhandled route errors.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Argus API running on http://localhost:${PORT}`);
});
