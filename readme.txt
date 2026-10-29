EVERSTILL — PHOTO-SHARING WEBSITE

1. PROJECT OVERVIEW

Everstill is a responsive photo-sharing website built using React, JavaScript, Node.js, Express, MongoDB Atlas and CSS.

The application includes user accounts, friends, photo posts, albums, search, comments, reactions, reporting and administrator moderation.

2. REQUIREMENTS

- Node.js 20 or later (Node.js 22 recommended).
- MongoDB Atlas cluster and connection string.
- Docker Desktop with Docker Compose.
- Git for source control.

3. ENVIRONMENT CONFIGURATION

Create a .env file in the project root directory, alongside docker-compose.yml.

Configure the following environment variables using your own credentials:

MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/photo_sharing?retryWrites=true&w=majority
SESSION_SECRET=replace-with-a-long-random-string
COOKIE_SECURE=false
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:4000

Replace the example MongoDB credentials and session secret with your actual configuration.

Do not commit or share the actual .env file. Ensure MongoDB Atlas network access permits connections from the machine running the application.

4. RUNNING WITH DOCKER

Open PowerShell or a terminal in the project root directory.

Build the Docker images and start the application in the background:

docker compose up --build -d

Check the status of the containers:

docker compose ps

Populate the database with sample data:

docker compose run --rm backend node src/seed.js

Website:
http://localhost:8080

API health endpoint:
http://localhost:4000/api/health

View container logs:

docker compose logs

Stop the application:

docker compose down

5. RUNNING LOCALLY

Backend:

Open a terminal in the project root and run:

cd backend
npm install
npm run seed
npm run dev

Frontend:

Open a second terminal in the project root and run:

cd frontend
npm install
npm run dev

Open the website at:

http://localhost:5173

Local backend execution must be able to load the root .env file. MongoDB Atlas must be configured to accept the connection.

6. SAMPLE ACCOUNTS

The seed script creates sample accounts for testing.

Password for the documented sample accounts:

Password123!

alice — ordinary user with friends and posts
admin — administrator/moderator
diego — has a pending friend request to elena

A seeded #architecture post has three reports to demonstrate community hiding and moderation behaviour.

7. DIRECTORY STRUCTURE

Everstill/
    backend/
        src/
            middleware/    Authentication and upload middleware
            models/        Database models
            routes/        API route handlers
            utils/         Shared utilities
            app.js         Express application configuration
            db.js          Database connection
            seed.js        Sample data initialisation
            server.js      Backend entry point
        Dockerfile
        package.json
        package-lock.json

    frontend/
        public/            Public static assets
        src/
            components/    Reusable UI components
            pages/         Application pages
            App.jsx        Main React application
            api.js         API communication
            AuthContext.jsx Authentication state
        Dockerfile
        nginx.conf
        package.json
        package-lock.json

    scripts/
        test-api.js        API testing script

    docker-compose.yml     Docker Compose configuration
    .gitignore             Git exclusion rules
    README.md               GitHub project documentation
    readme.txt              Setup and submission instructions

8. API TESTING

With the API running and the database seeded, run this command from the project root:

node scripts/test-api.js

The test script requires a running API and a configured, seeded database.

9. SOURCE CONTROL AND SUBMISSION

Public GitHub repository:

https://github.com/NokukhanyaNdlovu/Everstill

Submit the GitHub repository link and the required project files through ClickUP, following the lecturer's instructions.

Include the Docker configuration files and all necessary source files. Do not include the actual .env file, database credentials, or node_modules directories in the submission.
[4c3d6ba33df0a6e5e635d0d6a216985a8ba4e22d36c511f22ec610f604dc353764cb00f7c115b6d532a3829a602e79f8]