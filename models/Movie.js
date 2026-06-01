const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  year:         { type: Number, required: true },
  phase:        { type: Number, required: true, min: 1, max: 5 },
  mcuOrder:     { type: Number, required: true },        // release order in MCU
  director:     { type: String, required: true, trim: true },
  runtime:      { type: Number },                        // minutes
  budget:       { type: Number },                        // million USD
  boxOffice:    { type: Number },                        // million USD
  cast:         { type: [String], default: [] },
  description:  { type: String, trim: true },
  posterUrl:    { type: String, trim: true, default: '' },
  ratings:      { type: [Number], default: [] },
  views:        { type: Number, default: 0 },
}, { timestamps: true });

// ── Virtuals ───────────────────────────────────────────────────
movieSchema.virtual('averageRating').get(function () {
  if (!this.ratings.length) return 0;
  const sum = this.ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

movieSchema.virtual('roi').get(function () {
  if (!this.budget || !this.boxOffice) return null;
  return Math.round(((this.boxOffice - this.budget) / this.budget) * 100);
});

movieSchema.set('toJSON',   { virtuals: true });
movieSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Movie', movieSchema);
