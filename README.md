# 🎬 MarvelBase — Cinematic MCU Database

A full-stack MCU film database with a Marvel Studios–inspired cinematic UI, advanced D3.js analytics, and a complete REST API.

Built with **Node.js**, **Express**, **MongoDB Atlas**, **EJS**, and **D3.js**.

![Collection Page](https://github.com/user-attachments/assets/8137621a-ca48-44f3-821c-403edd58b77
)

---

## ✨ Features

- 🎞 **Cinematic UI** — premium streaming-platform aesthetic with motion, glassmorphism, gold/red Marvel palette
- 🎬 **Full CRUD** — add, edit, rate, and delete MCU films
- 🔎 **Live search & phase filtering**
- ⭐ **User ratings** with average calculation
- 📊 **Advanced D3.js analytics dashboard** with 5 data-driven visualizations
- 💾 **MongoDB Atlas** persistence via Mongoose
- 🧩 **Clean REST API** (`/api/movies`, `/api/stats`)
- 📱 Fully responsive

---

## 📸 Screenshots

### Collection / Home
The cinematic library view with phase filters, search, and movie cards.

![Collection](https://github.com/user-attachments/assets/d524998e-f8ee-4993-8862-0d260262a896
)

### Add / Edit Movie
Themed modal for creating and editing films.

![Add Movie Modal](https://github.com/user-attachments/assets/d3148a25-e6de-453b-aca9-2d2f9b72895c
)

### Analytics Dashboard
Insight strip + 5 D3.js charts revealing the MCU's data story.

![Stats Dashboard](https://github.com/user-attachments/assets/d4708c9f-13d4-4db6-9598-e3f964a19051
)

### Hits, Flops & Blockbusters
Log–log scatter of budget vs. box office with break-even and profit-multiplier guides.

![Box Office Chart](https://github.com/user-attachments/assets/a4e6cb55-3928-47ce-a2a5-46620341807b
)

### Phase Box-and-Whisker
Distribution of ratings across each MCU phase.

![Phase Chart](https://github.com/user-attachments/assets/2d459265-466e-46cb-b89b-4927e5206587
)

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Server | Node.js, Express |
| Database | MongoDB Atlas + Mongoose |
| Views | EJS + partials |
| Frontend | Vanilla JS, custom CSS, D3.js v7 |
| Utilities | dotenv, method-override |

---

## 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/<your-username>/marvelbase.git
cd marvelbase
```

### 2. Install

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/marvel
PORT=3000
```

### 4. Seed the database (optional)

```bash
npm run seed
```

### 5. Run

```bash
npm run dev    # development with nodemon
# or
npm start      # production
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET`    | `/`                       | Collection page |
| `GET`    | `/stats`                  | Analytics dashboard |
| `GET`    | `/api/movies`             | List all movies |
| `GET`    | `/api/movies/:id`         | Get one movie |
| `POST`   | `/api/movies`             | Create a movie |
| `PUT`    | `/api/movies/:id`         | Update a movie |
| `POST`   | `/api/movies/:id/rate`    | Add a rating (1–5) |
| `DELETE` | `/api/movies/:id`         | Delete a movie |
| `GET`    | `/api/stats`              | Aggregated analytics data |

### Example: Create a movie

```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Iron Man",
    "year": 2008,
    "phase": 1,
    "director": "Jon Favreau",
    "budget": 140000000,
    "boxOffice": 585800000
  }'
```

---

## 📊 The Analytics Dashboard

Five D3.js visualizations, each answering a specific question:

1. **Hits, Flops & Blockbusters** — Budget vs. box office on a log–log scatter, with break-even and 2×/3× profit guides.
2. **Quality vs. Success** — Rating vs. box office scatter, quadrant-labeled with a live linear-regression trend and correlation badge.
3. **Phase DNA (Box & Whisker)** — Rating distributions per phase with jittered film dots.
4. **Profit Timeline** — Chronological diverging bars: hits above the line, losses below, break-even reference and rich tooltips.
5. **Director Universe** — Circle-packing diagram sized by film count per director.

---

## 🗂 Project Structure

```
marvel-nosql/
├── controllers/        # Business logic
├── models/             # Mongoose schemas
├── routes/             # Express routes
├── views/              # EJS templates + partials
├── public/             # CSS, JS, assets
├── seed.js             # DB seeder
├── server.js           # App entry
└── package.json
```

---

## 📝 License

MIT — feel free to fork, remix, and build on it.

---

> Built with ❤️ for the MCU. Not affiliated with Marvel Studios or The Walt Disney Company.
