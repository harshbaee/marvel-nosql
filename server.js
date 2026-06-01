require('dotenv').config();
const express        = require('express');
const mongoose       = require('mongoose');
const methodOverride = require('method-override');
const path           = require('path');
const movieRoutes    = require('./routes/movieRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', movieRoutes);

app.use((req, res) => res.status(404).render('404', { title: '404' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀  Server → http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌  DB error:', err.message); process.exit(1); });
