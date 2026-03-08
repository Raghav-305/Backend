const path = require('path');
const fs = require('fs-extra');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');

const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(UPLOADS_DIR);

const app = express();

const { setupMiddleware } = require('./middleware/middleware');
setupMiddleware(app);

const apiRoutes = require('./routes/apiRoutes');
app.use('/', apiRoutes);

app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Neon-flux backend running on http://localhost:${PORT}`);
});
