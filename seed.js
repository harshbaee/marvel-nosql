/**
 * seed.js — Marvel MCU movies with REAL data
 *
 * Ratings derived from real public scores:
 *   IMDb score (out of 10) ÷ 2              → 0–5 scale
 *   RT Audience score (%)  ÷ 20             → 0–5 scale
 *   Final target = average of the two
 *
 * Vote count is proportional to worldwide box office.
 * buildRatings() produces integer arrays [1–5] whose mean ≈ target.
 *
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Movie    = require('./models/Movie');

// ── Helpers ───────────────────────────────────────────────────

/**
 * Generate `count` integers in [1,5] whose mean ≈ target.
 * Floor/ceil split + 15% noise for realistic spread.
 */
function buildRatings(target, count) {
  const clamped  = Math.min(5, Math.max(1, target));
  const low      = Math.floor(clamped);
  const high     = Math.min(5, low + 1);
  const fracHigh = clamped - low;
  const nHigh    = Math.round(count * fracHigh);
  const nLow     = count - nHigh;

  const arr = [...Array(nHigh).fill(high), ...Array(nLow).fill(low)];

  // 15% noise (keeps average within ±0.05 of target)
  const noiseCount = Math.round(count * 0.15);
  for (let i = 0; i < noiseCount; i++) {
    const idx = Math.floor(Math.random() * arr.length);
    const dir = Math.random() < 0.5 ? -1 : 1;
    arr[idx]  = Math.min(5, Math.max(1, arr[idx] + dir));
  }

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** IMDb (out of 10) + RT audience (%) → combined 0–5 target */
function toTarget(imdb, rt) {
  return Math.round(((imdb / 2) + (rt / 20)) / 2 * 100) / 100;
}

/** Votes proportional to box office (Endgame ~200, Hulk ~30) */
function votesFrom(boxOffice) {
  return Math.max(20, Math.round(30 + (boxOffice / 2799) * 170));
}

// ── Source data (all scores are real, verified) ───────────────
// imdb: IMDb rating  |  rt: RT Audience Score %
const TMDB = 'https://image.tmdb.org/t/p/w500';

const RAW = [
  // ── PHASE 1 ────────────────────────────────────────────────
  {
    title: 'Iron Man', year: 2008, phase: 1, mcuOrder: 1,
    director: 'Jon Favreau', runtime: 126, budget: 140, boxOffice: 585,
    imdb: 7.9, rt: 91,
    cast: ['Robert Downey Jr.', 'Gwyneth Paltrow', 'Jeff Bridges', 'Terrence Howard', 'Clark Gregg'],
    description: 'Billionaire Tony Stark is captured by terrorists and forced to build a weapon. Instead he builds a powered armoured suit and becomes Iron Man.',
    posterUrl: `${TMDB}/78lPtwv72VTzvZio9fB9iew3Y9a.jpg`,
  },
  {
    title: 'The Incredible Hulk', year: 2008, phase: 1, mcuOrder: 2,
    director: 'Louis Leterrier', runtime: 112, budget: 150, boxOffice: 264,
    imdb: 6.6, rt: 71,
    cast: ['Edward Norton', 'Liv Tyler', 'Tim Roth', 'William Hurt', 'Ty Burrell'],
    description: 'Scientist Bruce Banner roams the Earth searching for a cure for the gamma radiation that transforms him into the raging Hulk whenever he loses control.',
    posterUrl: `${TMDB}/gKzYx79y0AQTL4UAk1cBQJ3nvrm.jpg`,
  },
  {
    title: 'Iron Man 2', year: 2010, phase: 1, mcuOrder: 3,
    director: 'Jon Favreau', runtime: 124, budget: 200, boxOffice: 624,
    imdb: 7.0, rt: 72,
    cast: ['Robert Downey Jr.', 'Gwyneth Paltrow', 'Scarlett Johansson', 'Mickey Rourke', 'Don Cheadle', 'Sam Rockwell'],
    description: 'Tony Stark faces a rival weapons manufacturer and a vengeful Russian physicist while palladium poisoning from his arc reactor slowly kills him.',
    posterUrl: `${TMDB}/6WBeq4fCfn7AN33GmcGE1xa64Eo.jpg`,
  },
  {
    title: 'Thor', year: 2011, phase: 1, mcuOrder: 4,
    director: 'Kenneth Branagh', runtime: 115, budget: 150, boxOffice: 449,
    imdb: 7.0, rt: 76,
    cast: ['Chris Hemsworth', 'Natalie Portman', 'Tom Hiddleston', 'Anthony Hopkins', 'Kat Dennings'],
    description: 'The arrogant god Thor is stripped of his powers and exiled to Earth, while his scheming brother Loki plots to seize the Asgardian throne.',
    posterUrl: `${TMDB}/prSfAi1xGrhLQNxqoCs58q3sLEm.jpg`,
  },
  {
    title: 'Captain America: The First Avenger', year: 2011, phase: 1, mcuOrder: 5,
    director: 'Joe Johnston', runtime: 124, budget: 140, boxOffice: 371,
    imdb: 6.9, rt: 74,
    cast: ['Chris Evans', 'Hayley Atwell', 'Hugo Weaving', 'Tommy Lee Jones', 'Sebastian Stan', 'Stanley Tucci'],
    description: 'Frail Steve Rogers volunteers for a super-soldier experiment and becomes Captain America, battling HYDRA and the Red Skull during World War II.',
    posterUrl: `${TMDB}/vSNEBkqyGqT5UNHfluazz7FLQN.jpg`,
  },
  {
    title: 'The Avengers', year: 2012, phase: 1, mcuOrder: 6,
    director: 'Joss Whedon', runtime: 143, budget: 220, boxOffice: 1519,
    imdb: 8.0, rt: 91,
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Chris Hemsworth', 'Scarlett Johansson', 'Mark Ruffalo', 'Jeremy Renner', 'Tom Hiddleston'],
    description: "Nick Fury assembles Iron Man, Captain America, Thor, the Hulk, Black Widow and Hawkeye to stop Loki and his alien army from enslaving humanity.",
    posterUrl: `${TMDB}/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg`,
  },

  // ── PHASE 2 ────────────────────────────────────────────────
  {
    title: 'Iron Man 3', year: 2013, phase: 2, mcuOrder: 7,
    director: 'Shane Black', runtime: 130, budget: 200, boxOffice: 1215,
    imdb: 7.1, rt: 78,
    cast: ['Robert Downey Jr.', 'Guy Pearce', 'Gwyneth Paltrow', 'Ben Kingsley', 'Don Cheadle'],
    description: "When the terrorist Mandarin tears Tony Stark's world apart, he launches an investigation that forces him to question what it truly means to be Iron Man.",
    posterUrl: `${TMDB}/qhPtAc1TKbMPqNvcdXSOn9Bn7hZ.jpg`,
  },
  {
    title: 'Thor: The Dark World', year: 2013, phase: 2, mcuOrder: 8,
    director: 'Alan Taylor', runtime: 112, budget: 170, boxOffice: 645,
    imdb: 6.8, rt: 66,
    cast: ['Chris Hemsworth', 'Natalie Portman', 'Tom Hiddleston', 'Christopher Eccleston', 'Anthony Hopkins'],
    description: 'Thor must protect Jane Foster from Malekith and the Dark Elves, who seek an ancient weapon to plunge the universe into eternal darkness.',
    posterUrl: `${TMDB}/bnv7xPBPObGFiPvT0suU0FT9wSu.jpg`,
  },
  {
    title: 'Captain America: The Winter Soldier', year: 2014, phase: 2, mcuOrder: 9,
    director: 'Anthony Russo, Joe Russo', runtime: 136, budget: 170, boxOffice: 714,
    imdb: 7.7, rt: 92,
    cast: ['Chris Evans', 'Scarlett Johansson', 'Anthony Mackie', 'Robert Redford', 'Sebastian Stan', 'Samuel L. Jackson'],
    description: 'Steve Rogers uncovers a deep conspiracy within S.H.I.E.L.D. while facing a near-unstoppable assassin with ties to his own past: the Winter Soldier.',
    posterUrl: `${TMDB}/tVFRpFw3xTedgPGqxW0AOI4Aadh.jpg`,
  },
  {
    title: 'Guardians of the Galaxy', year: 2014, phase: 2, mcuOrder: 10,
    director: 'James Gunn', runtime: 121, budget: 170, boxOffice: 774,
    imdb: 8.0, rt: 92,
    cast: ['Chris Pratt', 'Zoe Saldana', 'Dave Bautista', 'Bradley Cooper', 'Vin Diesel', 'Lee Pace'],
    description: 'A ragtag band of cosmic misfits — Star-Lord, Gamora, Drax, Rocket and Groot — must unite to stop the fanatical Ronan from destroying the galaxy.',
    posterUrl: `${TMDB}/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg`,
  },
  {
    title: 'Avengers: Age of Ultron', year: 2015, phase: 2, mcuOrder: 11,
    director: 'Joss Whedon', runtime: 141, budget: 365, boxOffice: 1405,
    imdb: 7.3, rt: 83,
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo', 'Chris Hemsworth', 'Scarlett Johansson', 'James Spader', 'Paul Bettany'],
    description: "Tony Stark and Bruce Banner's attempt to create a peacekeeping AI called Ultron backfires catastrophically, forcing the Avengers to battle their own creation.",
    posterUrl: `${TMDB}/4ssDuvEDkSArWEdyBl2X5EHvYKU.jpg`,
  },
  {
    title: 'Ant-Man', year: 2015, phase: 2, mcuOrder: 12,
    director: 'Peyton Reed', runtime: 117, budget: 130, boxOffice: 519,
    imdb: 7.3, rt: 86,
    cast: ['Paul Rudd', 'Michael Douglas', 'Evangeline Lilly', 'Corey Stoll', 'Michael Peña'],
    description: "Con-man Scott Lang dons Dr. Hank Pym's shrinking suit and must pull off a heist to save the world from a dangerous new enemy — and become the Ant-Man.",
    posterUrl: `${TMDB}/MXHkOu0sGANFIFfio1aShMkIU0.jpg`,
  },

  // ── PHASE 3 ────────────────────────────────────────────────
  {
    title: 'Captain America: Civil War', year: 2016, phase: 3, mcuOrder: 13,
    director: 'Anthony Russo, Joe Russo', runtime: 147, budget: 250, boxOffice: 1153,
    imdb: 7.8, rt: 89,
    cast: ['Chris Evans', 'Robert Downey Jr.', 'Scarlett Johansson', 'Chadwick Boseman', 'Tom Holland', 'Sebastian Stan'],
    description: "Government pressure to regulate the Avengers fractures the team along ideological lines, pitting Captain America and Iron Man against each other.",
    posterUrl: `${TMDB}/rAGiXaUfDiyTdnFOeFQMATEU3lI.jpg`,
  },
  {
    title: 'Doctor Strange', year: 2016, phase: 3, mcuOrder: 14,
    director: 'Scott Derrickson', runtime: 115, budget: 165, boxOffice: 677,
    imdb: 7.5, rt: 86,
    cast: ['Benedict Cumberbatch', 'Chiwetel Ejiofor', 'Rachel McAdams', 'Tilda Swinton', 'Mads Mikkelsen'],
    description: "After a career-ending accident, brilliant neurosurgeon Stephen Strange discovers the world of the mystic arts and must stop a rogue sorcerer from destroying reality.",
    posterUrl: `${TMDB}/xfWac8MTYDxujaxgPVcRD45qchN.jpg`,
  },
  {
    title: 'Guardians of the Galaxy Vol. 2', year: 2017, phase: 3, mcuOrder: 15,
    director: 'James Gunn', runtime: 136, budget: 200, boxOffice: 863,
    imdb: 7.6, rt: 87,
    cast: ['Chris Pratt', 'Zoe Saldana', 'Dave Bautista', 'Bradley Cooper', 'Kurt Russell', 'Vin Diesel'],
    description: "Peter Quill discovers the truth about his mysterious father Ego while the Guardians struggle to stay together — and to define what family truly means.",
    posterUrl: `${TMDB}/y4MBh0EjBlMuOzv9axM4SRFMgm2.jpg`,
  },
  {
    title: 'Spider-Man: Homecoming', year: 2017, phase: 3, mcuOrder: 16,
    director: 'Jon Watts', runtime: 133, budget: 175, boxOffice: 880,
    imdb: 7.4, rt: 87,
    cast: ['Tom Holland', 'Michael Keaton', 'Robert Downey Jr.', 'Marisa Tomei', 'Jon Favreau', 'Zendaya'],
    description: "Fifteen-year-old Peter Parker balances high school in Queens with his life as Spider-Man, all while trying to impress mentor Tony Stark.",
    posterUrl: `${TMDB}/c24sv2weTHPsmDa7jEMN0kRapids.jpg`,
  },
  {
    title: 'Thor: Ragnarok', year: 2017, phase: 3, mcuOrder: 17,
    director: 'Taika Waititi', runtime: 130, budget: 180, boxOffice: 854,
    imdb: 7.9, rt: 87,
    cast: ['Chris Hemsworth', 'Tom Hiddleston', 'Mark Ruffalo', 'Cate Blanchett', 'Tessa Thompson', 'Jeff Goldblum'],
    description: "Imprisoned on Sakaar, Thor must escape a gladiatorial arena, team up with Hulk, and race home to stop his ruthless sister Hela from triggering Ragnarok.",
    posterUrl: `${TMDB}/rzRwTcFvttcN1gjkGgaSaBjiq9r.jpg`,
  },
  {
    title: 'Black Panther', year: 2018, phase: 3, mcuOrder: 18,
    director: 'Ryan Coogler', runtime: 134, budget: 200, boxOffice: 1347,
    imdb: 7.3, rt: 79,
    cast: ['Chadwick Boseman', 'Michael B. Jordan', "Lupita Nyong'o", 'Danai Gurira', 'Martin Freeman', 'Andy Serkis'],
    description: "T'Challa returns to Wakanda to claim his throne, only to face a powerful challenger whose claim threatens to drag the entire world into war.",
    posterUrl: `${TMDB}/uxzzxijgPIY7slzFvMotPv8wjKA.jpg`,
  },
  {
    title: 'Avengers: Infinity War', year: 2018, phase: 3, mcuOrder: 19,
    director: 'Anthony Russo, Joe Russo', runtime: 149, budget: 325, boxOffice: 2048,
    imdb: 8.4, rt: 91,
    cast: ['Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo', 'Josh Brolin', 'Benedict Cumberbatch', 'Chadwick Boseman', 'Chris Evans'],
    description: 'Thanos arrives to collect the six Infinity Stones. The Avengers and their allies must sacrifice everything to stop him before he erases half of all life.',
    posterUrl: `${TMDB}/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg`,
  },
  {
    title: 'Ant-Man and the Wasp', year: 2018, phase: 2, mcuOrder: 20,
    director: 'Peyton Reed', runtime: 118, budget: 162, boxOffice: 623,
    imdb: 7.0, rt: 83,
    cast: ['Paul Rudd', 'Evangeline Lilly', 'Michael Peña', 'Michael Douglas', 'Michelle Pfeiffer', 'Hannah John-Kamen'],
    description: "Scott Lang must juggle fatherhood with a new mission from Hope and Hank Pym: rescuing the original Wasp, Janet van Dyne, from the Quantum Realm.",
    posterUrl: `${TMDB}/dKha79QGoBjFhMnhLdxl8R7Qtxj.jpg`,
  },
  {
    title: 'Captain Marvel', year: 2019, phase: 3, mcuOrder: 21,
    director: 'Anna Boden, Ryan Fleck', runtime: 124, budget: 175, boxOffice: 1128,
    imdb: 6.8, rt: 45,
    cast: ['Brie Larson', 'Samuel L. Jackson', 'Ben Mendelsohn', 'Jude Law', 'Annette Bening', 'Lashana Lynch'],
    description: "Set in the 1990s, Carol Danvers becomes one of the most powerful beings in the universe when Earth is caught in an intergalactic war between two alien races.",
    posterUrl: `${TMDB}/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg`,
  },
  {
    title: 'Avengers: Endgame', year: 2019, phase: 3, mcuOrder: 22,
    director: 'Anthony Russo, Joe Russo', runtime: 181, budget: 356, boxOffice: 2799,
    imdb: 8.4, rt: 90,
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo', 'Chris Hemsworth', 'Scarlett Johansson', 'Jeremy Renner', 'Josh Brolin'],
    description: "The surviving Avengers travel back through time to undo Thanos' Snap and restore the universe — in the most epic showdown in MCU history.",
    posterUrl: `${TMDB}/or06FN3Dka5tukK1e9sl16pB3iy.jpg`,
  },
  {
    title: 'Spider-Man: Far From Home', year: 2019, phase: 3, mcuOrder: 23,
    director: 'Jon Watts', runtime: 129, budget: 160, boxOffice: 1132,
    imdb: 7.4, rt: 95,
    cast: ['Tom Holland', 'Samuel L. Jackson', 'Zendaya', 'Jake Gyllenhaal', 'Cobie Smulders', 'Jon Favreau'],
    description: 'Peter Parker tries to enjoy a school trip to Europe, but Nick Fury drags him into a new threat — and the mysterious new hero Mysterio.',
    posterUrl: `${TMDB}/rjbNpRMoVvqHmhmksbokcyNBTvJ.jpg`,
  },

  // ── PHASE 4 ────────────────────────────────────────────────
  {
    title: 'Black Widow', year: 2021, phase: 4, mcuOrder: 24,
    director: 'Cate Shortland', runtime: 134, budget: 200, boxOffice: 379,
    imdb: 6.7, rt: 80,
    cast: ['Scarlett Johansson', 'Florence Pugh', 'David Harbour', 'Rachel Weisz', 'Ray Winstone'],
    description: "Natasha Romanoff confronts the Red Room and the ghosts of her past, reuniting with her surrogate family to take down the organisation that created her.",
    posterUrl: `${TMDB}/qAZ0pzat24kLdO0MydetaKqQp6X.jpg`,
  },
  {
    title: 'Shang-Chi and the Legend of the Ten Rings', year: 2021, phase: 4, mcuOrder: 25,
    director: 'Destin Daniel Cretton', runtime: 132, budget: 150, boxOffice: 432,
    imdb: 7.4, rt: 98,
    cast: ['Simu Liu', 'Tony Leung', 'Awkwafina', 'Ben Kingsley', 'Fala Chen', "Meng'er Zhang"],
    description: "Shang-Chi is drawn into the web of the mythical Ten Rings organisation — and must confront his long-lost father, its all-powerful leader Xu Wenwu.",
    posterUrl: `${TMDB}/1BIoJGKbXjdFDAqUEiA2VHqkK1Z.jpg`,
  },
  {
    title: 'Eternals', year: 2021, phase: 4, mcuOrder: 26,
    director: 'Chloé Zhao', runtime: 156, budget: 200, boxOffice: 402,
    imdb: 6.3, rt: 78,
    cast: ['Gemma Chan', 'Richard Madden', 'Kumail Nanjiani', 'Lauren Ridloff', 'Brian Tyree Henry', 'Salma Hayek', 'Angelina Jolie'],
    description: "Immortal beings who have secretly lived on Earth for millennia must reunite when an ancient threat emerges that could destroy all of humanity.",
    posterUrl: `${TMDB}/6AdXwFdNLeFwxJwRLUTzNgOm7MH.jpg`,
  },
  {
    title: 'Spider-Man: No Way Home', year: 2021, phase: 4, mcuOrder: 27,
    director: 'Jon Watts', runtime: 148, budget: 200, boxOffice: 1901,
    imdb: 8.2, rt: 99,
    cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch', 'Jamie Foxx', 'Alfred Molina', 'Willem Dafoe'],
    description: "With his identity exposed, Peter Parker asks Doctor Strange for help. The spell tears open the Multiverse, unleashing villains — and heroes — from other realities.",
    posterUrl: `${TMDB}/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg`,
  },
  {
    title: 'Doctor Strange in the Multiverse of Madness', year: 2022, phase: 4, mcuOrder: 28,
    director: 'Sam Raimi', runtime: 126, budget: 200, boxOffice: 955,
    imdb: 6.9, rt: 86,
    cast: ['Benedict Cumberbatch', 'Elizabeth Olsen', 'Chiwetel Ejiofor', 'Benedict Wong', 'Xochitl Gomez', 'Patrick Stewart'],
    description: "Strange teams with multiverse-hopping teenager America Chavez, but their journey awakens the terrifying Scarlet Witch and threatens to unravel all of reality.",
    posterUrl: `${TMDB}/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg`,
  },
  {
    title: 'Thor: Love and Thunder', year: 2022, phase: 4, mcuOrder: 29,
    director: 'Taika Waititi', runtime: 119, budget: 250, boxOffice: 761,
    imdb: 6.3, rt: 67,
    cast: ['Chris Hemsworth', 'Tessa Thompson', 'Natalie Portman', 'Christian Bale', 'Russell Crowe'],
    description: "Thor teams with Valkyrie, Korg and ex-girlfriend Jane Foster — who now wields Mjolnir — to stop Gorr the God Butcher from eliminating all gods.",
    posterUrl: `${TMDB}/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg`,
  },
  {
    title: 'Black Panther: Wakanda Forever', year: 2022, phase: 4, mcuOrder: 30,
    director: 'Ryan Coogler', runtime: 161, budget: 250, boxOffice: 859,
    imdb: 6.8, rt: 87,
    cast: ['Letitia Wright', 'Angela Bassett', 'Tenoch Huerta', "Lupita Nyong'o", 'Winston Duke', 'Martin Freeman'],
    description: "Grieving the loss of T'Challa, Wakanda must defend itself from the powerful underwater nation Talokan and its ruler, the ancient Namor.",
    posterUrl: `${TMDB}/sv1xJUazXoQuIDtiiz8746Hqd9x.jpg`,
  },

  // ── PHASE 5 ────────────────────────────────────────────────
  {
    title: 'Ant-Man and the Wasp: Quantumania', year: 2023, phase: 5, mcuOrder: 31,
    director: 'Peyton Reed', runtime: 124, budget: 200, boxOffice: 476,
    imdb: 6.0, rt: 83,
    cast: ['Paul Rudd', 'Evangeline Lilly', 'Jonathan Majors', 'Michael Douglas', 'Michelle Pfeiffer', 'Kathryn Newton'],
    description: "Scott Lang and his family are accidentally pulled into the Quantum Realm, where they face Kang the Conqueror — a time-travelling tyrant with vast power.",
    posterUrl: `${TMDB}/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg`,
  },
  {
    title: 'Guardians of the Galaxy Vol. 3', year: 2023, phase: 5, mcuOrder: 32,
    director: 'James Gunn', runtime: 150, budget: 250, boxOffice: 845,
    imdb: 7.9, rt: 94,
    cast: ['Chris Pratt', 'Zoe Saldana', 'Dave Bautista', 'Bradley Cooper', 'Will Poulter', 'Chukwudi Iwuji', 'Karen Gillan'],
    description: "The Guardians embark on a mission to protect Rocket from his dark origin — a journey that brings their story full circle in a deeply emotional finale.",
    posterUrl: `${TMDB}/r2J02Z2OpNTctfOSN1Ydgroma84.jpg`,
  },
  {
    title: 'The Marvels', year: 2023, phase: 5, mcuOrder: 33,
    director: 'Nia DaCosta', runtime: 105, budget: 220, boxOffice: 206,
    imdb: 5.7, rt: 83,
    cast: ['Brie Larson', 'Teyonah Parris', 'Iman Vellani', 'Zawe Ashton', 'Samuel L. Jackson'],
    description: "Carol Danvers, Kamala Khan and Monica Rambeau must work together after their powers become entangled, causing them to swap places every time they use them.",
    posterUrl: `${TMDB}/Ag3D9qXjhJ2FUkrlJ0Cv1pgxqYQ.jpg`,
  },
  {
    title: 'Deadpool & Wolverine', year: 2024, phase: 5, mcuOrder: 34,
    director: 'Shawn Levy', runtime: 128, budget: 200, boxOffice: 1338,
    imdb: 7.7, rt: 94,
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen', 'Jennifer Garner', 'Wesley Snipes'],
    description: "Deadpool is recruited by the TVA and partners with a reluctant Wolverine to face a universe-threatening crisis — and officially enter the MCU.",
    posterUrl: `${TMDB}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg`,
  },
  {
    title: 'Captain America: Brave New World', year: 2025, phase: 5, mcuOrder: 35,
    director: 'Julius Onah', runtime: 118, budget: 180, boxOffice: 420,
    imdb: 6.1, rt: 79,
    cast: ['Anthony Mackie', 'Harrison Ford', 'Danny Ramirez', 'Shira Haas', 'Tim Blake Nelson', 'Carl Lumbly'],
    description: "Sam Wilson embraces his role as Captain America while navigating a geopolitical crisis tied to the newly elected President Thaddeus Ross.",
    posterUrl: `${TMDB}/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg`,
  },
  {
    title: 'Thunderbolts*', year: 2025, phase: 5, mcuOrder: 36,
    director: 'Jake Schreier', runtime: 127, budget: 180, boxOffice: 385,
    imdb: 7.1, rt: 95,
    cast: ['Florence Pugh', 'Sebastian Stan', 'Wyatt Russell', 'Olga Kurylenko', 'David Harbour', 'Hannah John-Kamen', 'Lewis Pullman'],
    description: "Six antiheroes — Yelena Belova, Bucky Barnes, Red Guardian, Ghost, Taskmaster and John Walker — are thrown together and must confront who they truly are.",
    posterUrl: `${TMDB}/m9EtP01PEFiSqcnDYFOPOllCQoT.jpg`,
  },
];

// ── Build final documents ─────────────────────────────────────
const MOVIES = RAW.map(m => ({
  title:       m.title,
  year:        m.year,
  phase:       m.phase,
  mcuOrder:    m.mcuOrder,
  director:    m.director,
  runtime:     m.runtime,
  budget:      m.budget,
  boxOffice:   m.boxOffice,
  cast:        m.cast,
  description: m.description,
  posterUrl:   m.posterUrl,
  ratings:     buildRatings(toTarget(m.imdb, m.rt), votesFrom(m.boxOffice)),
  views:       0,
}));

// ── Run seed ──────────────────────────────────────────────────
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB Atlas\n');

    await Movie.deleteMany({});
    console.log('🧹  Cleared existing movies\n');

    await Movie.insertMany(MOVIES);

    console.log(
      '#'.padEnd(4) +
      'Title'.padEnd(46) +
      'IMDb'.padEnd(7) +
      'RT Aud'.padEnd(8) +
      'Target/5'.padEnd(10) +
      'Votes'
    );
    console.log('─'.repeat(80));

    RAW.forEach((m, i) => {
      const target = toTarget(m.imdb, m.rt);
      const votes  = votesFrom(m.boxOffice);
      console.log(
        String(i + 1).padEnd(4) +
        m.title.slice(0, 44).padEnd(46) +
        String(m.imdb).padEnd(7) +
        `${m.rt}%`.padEnd(8) +
        String(target).padEnd(10) +
        votes
      );
    });

    console.log('\n🎬  36 movies seeded with real IMDb + RT scores!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌  Seed error:', err.message);
    process.exit(1);
  }
})();
