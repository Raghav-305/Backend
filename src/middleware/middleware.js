const path = require('path');
const fs = require('fs-extra');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.ensureDirSync(UPLOADS_DIR);

function setupMiddleware(app) {
  app.use(helmet());
  app.use(require('express').json({ limit: '1mb' }));
  app.use(require('express').urlencoded({ extended: true }));
  app.use(morgan('tiny'));

  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
  };
  app.use(cors(corsOptions));

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', limiter);
}

const upload = multer({ dest: UPLOADS_DIR });

module.exports = { setupMiddleware, upload, UPLOADS_DIR };
