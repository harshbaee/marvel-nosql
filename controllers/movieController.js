const Movie = require('../models/Movie');

// ── Pages ──────────────────────────────────────────────────────
exports.index     = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ mcuOrder: 1 });
    res.render('index', { movies, title: 'MCU Collection' });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

exports.statsPage = async (req, res) => {
  try { res.render('stats', { title: 'Statistics' }); }
  catch (err) { res.status(500).render('error', { message: err.message }); }
};

// ── API: list (with search + filter) ──────────────────────────
exports.apiGetAll = async (req, res) => {
  try {
    const { search, phase } = req.query;
    const filter = {};
    if (search?.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: rx }, { director: rx }, { cast: rx }];
    }
    if (phase && phase !== 'all') filter.phase = parseInt(phase);
    const movies = await Movie.find(filter).sort({ mcuOrder: 1 });
    res.json(movies.map(m => m.toObject()));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── API: single (increments views) ────────────────────────────
exports.apiGetOne = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    );
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie.toObject());
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── API: create ────────────────────────────────────────────────
exports.apiCreate = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie.toObject());
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', messages: Object.values(err.errors).map(e => e.message) });
    }
    res.status(500).json({ error: err.message });
  }
};

// ── API: update ────────────────────────────────────────────────
exports.apiUpdate = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie.toObject());
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', messages: Object.values(err.errors).map(e => e.message) });
    }
    res.status(500).json({ error: err.message });
  }
};

// ── API: rate ──────────────────────────────────────────────────
exports.apiRate = async (req, res) => {
  try {
    const rating = parseInt(req.body.rating, 10);
    if (isNaN(rating) || rating < 0 || rating > 5)
      return res.status(400).json({ error: 'Rating must be 0–5' });
    const movie = await Movie.findByIdAndUpdate(
      req.params.id, { $push: { ratings: rating } }, { new: true }
    );
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json({ averageRating: movie.toObject().averageRating, totalRatings: movie.ratings.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── API: delete ────────────────────────────────────────────────
exports.apiDelete = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json({ message: `"${movie.title}" deleted successfully` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── API: full stats + leaderboards ────────────────────────────
exports.apiStats = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ mcuOrder: 1 });
    const objs   = movies.map(m => m.toObject());

    // Phase distribution
    const phaseCounts = {};
    objs.forEach(m => { phaseCounts[`Phase ${m.phase}`] = (phaseCounts[`Phase ${m.phase}`] || 0) + 1; });

    // Director distribution
    const directorCounts = {};
    objs.forEach(m => { directorCounts[m.director] = (directorCounts[m.director] || 0) + 1; });

    // Box office by phase
    const phaseBoxOffice = {};
    objs.forEach(m => {
      const k = `Phase ${m.phase}`;
      phaseBoxOffice[k] = (phaseBoxOffice[k] || 0) + (m.boxOffice || 0);
    });

    // Leaderboards
    const topRated = [...objs]
      .filter(m => m.ratings.length > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10)
      .map(m => ({ title: m.title, value: m.averageRating, year: m.year, posterUrl: m.posterUrl }));

    const mostViewed = [...objs]
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map(m => ({ title: m.title, value: m.views, year: m.year, posterUrl: m.posterUrl }));

    const highestGrossing = [...objs]
      .filter(m => m.boxOffice)
      .sort((a, b) => b.boxOffice - a.boxOffice)
      .slice(0, 10)
      .map(m => ({ title: m.title, value: m.boxOffice, year: m.year, posterUrl: m.posterUrl }));

    const bestROI = [...objs]
      .filter(m => m.roi !== null)
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10)
      .map(m => ({ title: m.title, value: m.roi, year: m.year, posterUrl: m.posterUrl }));

    // Chart data: box office over time
    const boxOfficeTimeline = objs
      .filter(m => m.boxOffice)
      .map(m => ({ title: m.title, year: m.year, boxOffice: m.boxOffice, budget: m.budget || 0 }));

    // Ratings chart per movie
    const ratingsChart = objs.map(m => ({ title: m.title, avg: m.averageRating, count: m.ratings.length }));

    const totalBoxOffice = objs.reduce((s, m) => s + (m.boxOffice || 0), 0);
    const totalBudget    = objs.reduce((s, m) => s + (m.budget    || 0), 0);
    const ratedMovies    = objs.filter(m => m.ratings.length > 0);
    const overallAvg     = ratedMovies.length
      ? Math.round((ratedMovies.reduce((s, m) => s + m.averageRating, 0) / ratedMovies.length) * 10) / 10
      : 0;

    res.json({
      totalMovies: movies.length,
      totalBoxOffice: Math.round(totalBoxOffice),
      totalBudget: Math.round(totalBudget),
      overallAvgRating: overallAvg,
      phaseCounts,
      directorCounts,
      phaseBoxOffice,
      boxOfficeTimeline,
      ratingsChart,
      topRated,
      mostViewed,
      highestGrossing,
      bestROI,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
