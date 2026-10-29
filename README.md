# Everstill — photo-sharing website

Responsive photo sharing with accounts, friends, albums, search, reporting, and administrator moderation. Stack matches the PRD: React (JavaScript), Node.js, MongoDB Atlas, CSS, native Fetch, session cookies, Git, and Docker.

## Requirements

- Node.js 20+ (22 recommended)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- Docker Desktop if you want the containerized frontend and backend

## Environment

Add the following to `.env` and set:

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/photo_sharing?retryWrites=true&w=majority
SESSION_SECRET=a-long-random-string
COOKIE_SECURE=false
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:4000
```

Do not commit `.env`. Atlas must allow your current IP (and `0.0.0.0/0` if Docker runs from a changing IP).

## Local development

```bash
cd backend
npm install
npm run seed
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/uploads` to the API.

Seed logins (password for all: `Password123!`):

- `alice` — ordinary user with friends and posts
- `admin` — administrator / moderator
- `diego` has a pending request to `elena`

Hashtag `#architecture` is on a post with 3 reports so the global feed shows the community hide/reveal behaviour.

## Docker

```bash
docker compose up --build
docker compose run --rm backend node src/seed.js
```

App: `http://localhost:8080`  
API (direct): `http://localhost:4000/api/health`

Nginx on the frontend container proxies `/api` and `/uploads` to the backend so session cookies stay first-party.

## What is implemented

- Splash, registration, login, logout, httpOnly `sid` cookies stored in MongoDB Atlas
- Local/global feeds, profiles (friends see full details; others see name + picture)
- Friend request send / accept / decline / unfriend
- Photo posts (description + hashtags editable; image not replaceable)
- Comments and five emoji reactions submitted as comments: ❤️ 😂 🔥 😮 😢
- Public albums; deleting an album keeps the posts
- Search (people, posts, albums, hashtags) with fuzzy matching and autocomplete
- Reporting, 3+ report placeholder, admin review, delete post or remove reports
- Toast when an administrator deleted a user’s post
- Responsive CSS breakpoints at 768px and 1024px

## API tests

```bash
node scripts/test-api.js
```

Requires a running API and `MONGODB_URI` already seeded.
