# CareerTrack

CareerTrack is a small job search workspace. Keep applications, interview notes, and follow-ups together, and get a quick view of where each opportunity stands.

The app has a Spring Boot REST API, a React and TypeScript frontend, and PostgreSQL for storage. It is set up to run locally with Docker Compose and can be deployed as three services: a web container, an API container, and a managed PostgreSQL database.

## What it does

- Create an account and sign in with a password stored as a BCrypt hash.
- Add, edit, search, filter, and remove job applications.
- Keep a link, location, application date, and private notes with each role.
- See counts for saved, applied, interviewing, and offered roles.
- Keep application records scoped to the signed-in user.
- Run the frontend and API behind one web origin in the Compose setup.

## Stack

| Area | Choice |
| --- | --- |
| API | Java 21, Spring Boot, Spring Security, Spring Data JPA |
| Authentication | Stateless JWTs, BCrypt password hashing |
| Web | React, TypeScript, Vite |
| Database | PostgreSQL 16 |
| Local deployment | Docker Compose, Nginx |
| CI | GitHub Actions (API package and frontend production build) |

## Run it locally

You’ll need Docker Desktop with Compose enabled. From the repository root:

```sh
cp .env.example .env
```

On Windows PowerShell, copy the environment template with:

```powershell
Copy-Item .env.example .env
```

Change `POSTGRES_PASSWORD` and `JWT_SECRET` in `.env` before sharing the app outside your machine. The JWT secret should be a long random value (at least 32 characters).

Start the stack:

```sh
docker compose up --build
```

Open [http://localhost:8088](http://localhost:8088). The first start builds both application containers and can take a few minutes. The database data lives in the `postgres_data` Docker volume and remains across container restarts.

Stop the services with `Ctrl+C`, then run `docker compose down`. To remove the local database too, use `docker compose down -v`.

### Run the frontend and API separately

For UI work, start PostgreSQL and the API with Compose, then run Vite in a second terminal:

```sh
docker compose up db api
cd frontend
npm install
npm run dev
```

Vite serves the site at [http://localhost:5173](http://localhost:5173) and forwards `/api` calls to port 8080. Java 21 and Maven are required if you want to run the API outside its container.

## API overview

All successful application responses use JSON. Protected routes expect `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/applications` | List records; supports `q` and `status` query parameters |
| `POST` | `/api/applications` | Add a record |
| `PUT` | `/api/applications/{id}` | Update a record |
| `DELETE` | `/api/applications/{id}` | Remove a record |
| `GET` | `/api/dashboard` | Get application counts |
| `GET` | `/actuator/health` | Container health check |

Application statuses are `SAVED`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`, and `WITHDRAWN`. Validation errors include a `fields` object to help identify invalid input.

## Configuration

Compose reads these values from `.env`; production should provide them as platform secrets.

| Variable | Purpose |
| --- | --- |
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `JWT_SECRET` | Signing key for access tokens |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated allowed browser origins |
| `WEB_PORT` | Host port for the site (default `8088`) |

The API currently uses Hibernate schema updates to keep local setup simple. For a production deployment with an existing database, switch schema management to versioned Flyway migrations before evolving the schema. Use HTTPS and a managed database when deploying publicly.

## Project layout

```text
backend/src/main/java/com/careertrack/
  application/    Application model, status, API, and service
  auth/           Registration and login
  common/         API errors and exception mapping
  security/       JWT handling and security configuration
  user/           User model and repository
backend/src/main/resources/  Spring configuration
frontend/src/                React pages, API client, and styles
docs/architecture.md         System overview and request flow
compose.yaml                 Local web, API, and database stack
```

## Deploying

The Compose file is a convenient single-host deployment starting point. For a hosted setup, publish the API and frontend containers to your registry, attach a managed PostgreSQL instance, and set the database URL/credentials and JWT secret as protected environment values. Serve the app over HTTPS, set `APP_CORS_ALLOWED_ORIGINS` to the deployed site origin, and configure a persistent database backup policy. The frontend Nginx configuration forwards `/api` and `/actuator` to the API service; use your hosting provider’s equivalent internal service name when running outside Compose.

The GitHub Actions workflow builds the API and frontend for pushes and pull requests to `main`. Add deployment credentials and a deployment job only after choosing a hosting provider.

## License

MIT. See [LICENSE](LICENSE).
