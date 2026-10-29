# Everstill — Photo-Sharing Website

Everstill is a responsive photo-sharing website that allows users to share photos, connect with friends, create albums, search for content, and interact with posts. Administrators can moderate reported content and manage users.

## Technology Stack

- **Frontend:** React, JavaScript, CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **Authentication:** Session-based authentication using HTTP-only cookies
- **Deployment:** Docker, Docker Compose, and Nginx
- **Testing:** Node.js API test script

## Requirements

- Node.js 20 or later (Node.js 22 recommended)
- A MongoDB Atlas cluster
- Docker Desktop with Docker Compose
- Git (for source control)

## Environment Configuration

Create a `.env` file in the project root, alongside `docker-compose.yml`, and configure the following variables using your own MongoDB Atlas connection details and a secure session secret:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/photo_sharing?retryWrites=true&w=majority
SESSION_SECRET=replace-with-a-long-random-string
COOKIE_SECURE=false
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:4000
```

Replace the example MongoDB credentials and session secret with your actual values. Do not commit or share the real `.env` file.

Ensure MongoDB Atlas network access allows connections from the machine running the application.

## Running with Docker

Run these commands from the project root directory.

Build the images and start the application in the background:

```powershell
docker compose up --build -d
```

Check the container status:

```powershell
docker compose ps
```

Populate the database with sample data:

```powershell
docker compose run --rm backend node src/seed.js
```

Open the application at:

- **Website:** http://localhost:8080
- **API health endpoint:** http://localhost:4000/api/health

View container logs:

```powershell
docker compose logs
```

Stop the application:

```powershell
docker compose down
```

## Running Locally

### Backend

Open a terminal in the project root and run:

```powershell
cd backend
npm install
npm run seed
npm run dev
```

### Frontend

Open a second terminal in the project root and run:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

**Note:** Local backend execution must be able to load the root `.env` file. The backend must also be able to connect to MongoDB Atlas. The Docker configuration loads the root `.env` file through `docker-compose.yml`.

## Sample Accounts

The seed script provides sample accounts for testing. The password for the documented sample accounts is:

`Password123!`

- `alice` — ordinary user with friends and posts
- `admin` — administrator/moderator
- `diego` — has a pending friend request to `elena`

The seeded `#architecture` post has three reports to demonstrate community hiding and moderation behaviour.

Use sample credentials only in your local development environment.

## Implemented Features

- User registration, login and logout
- Session-based authentication with HTTP-only cookies stored using MongoDB
- Local and global feeds
- User profiles with friend-based visibility rules
- Sending, accepting and declining friend requests
- Unfriending users
- Photo posts with editable descriptions and hashtags
- Comments and emoji reactions
- Public albums
- Search for people, posts, albums and hashtags, including autocomplete
- Reporting posts and community report thresholds
- Administrator moderation and content management
- Notifications when an administrator deletes a user's post
- Responsive layout for different screen sizes

## API Testing

With the API running and the database seeded, execute the following command from the project root:

```powershell
node scripts/test-api.js
```

The test script requires a running API and a configured, seeded database.

## Repository

GitHub repository: https://github.com/NokukhanyaNdlovu/Everstill
