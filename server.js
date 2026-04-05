require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { bootstrapData, getSettings } = require('./helpers/data');
const { ensureDailyReset } = require('./helpers/results');
const { ensureDailyPredictions } = require('./helpers/predictions');

bootstrapData();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use((req, res, next) => {
  ensureDailyReset();
  ensureDailyPredictions();
  const settings = getSettings();
  res.locals.site = settings;
  res.locals.baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  res.locals.adminSession = req.session.admin || null;
  next();
});

app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('pages/404', { pageTitle: '404', settings: getSettings() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
