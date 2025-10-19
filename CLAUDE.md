# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Teacher Class Scheduler is a full-stack application for managing class schedules, textbooks, templates, and days off. The project uses a modern containerized architecture with separate development and production Docker/Podman configurations.

**Tech Stack:**
- Frontend: Vue 3 (Composition API), Vuex 4, Vue Router 4, Vite, Axios
- Backend: Express.js, Sequelize ORM, JWT authentication
- Database: PostgreSQL 15
- Deployment: Docker/Podman with separate dev and prod configurations

## Project Structure

```
/
├── client/              # Vue.js frontend application
│   ├── src/
│   │   ├── components/  # Reusable Vue components
│   │   │   ├── auth/    # Login/Register forms
│   │   │   ├── panels/  # Main UI panels
│   │   │   └── modals/  # Modal dialogs
│   │   ├── views/       # Route-level components
│   │   ├── store/       # Vuex state management
│   │   │   └── modules/ # Separated Vuex modules (auth, classes, schedule, etc.)
│   │   ├── router/      # Vue Router configuration
│   │   ├── services/    # API service layer (ApiService, ClassesService, etc.)
│   │   └── App.vue      # Root component
│   └── vite.config.js   # Vite dev server with proxy to backend
│
├── server/              # Express.js backend API
│   ├── routes/          # API route handlers (authRoutes, classRoutes, etc.)
│   ├── models/          # Sequelize model definitions
│   ├── middleware/      # Express middleware (authenticateToken)
│   ├── migrations/      # Database migrations (Sequelize CLI)
│   ├── seeders/         # Database seed files
│   ├── config/          # Database configuration
│   └── server.js        # Express app entry point
│
├── scripts/             # Utility scripts
│   └── manage.sh        # Main management script for dev/prod
│
├── podman-compose.dev.yml   # Development environment (hot reload)
└── podman-compose.yml       # Production environment
```

## Development Commands

### Starting the Application

Use the unified management script for all operations:

**Development (with hot-reload):**
```bash
./scripts/manage.sh start:dev    # Start all services (client, server, db)
./scripts/manage.sh stop:dev     # Stop development containers
./scripts/manage.sh logs:dev     # View server logs
```

**Production:**
```bash
./scripts/manage.sh start:prod   # Start production build
./scripts/manage.sh stop:prod    # Stop production containers
./scripts/manage.sh logs:prod    # View production server logs
```

### Running Services Individually

**Backend (server):**
```bash
cd server
yarn install
yarn dev              # Start with nodemon (development)
yarn start            # Start with node (production)
yarn db:migrate       # Run database migrations
yarn db:migrate:undo  # Rollback last migration
yarn db:seed:all      # Run all seeders
```

**Frontend (client):**
```bash
cd client
yarn install
yarn dev              # Start Vite dev server (http://localhost:5173)
yarn build            # Build for production
yarn preview          # Preview production build
```

### Database Migrations

```bash
cd server
npx sequelize-cli migration:generate --name description-of-migration
yarn db:migrate       # Apply migrations
yarn db:migrate:undo  # Rollback last migration
```

## Architecture & Key Concepts

### Authentication Flow

1. **JWT-based authentication** using `jsonwebtoken` package
2. Tokens stored in Vuex store (`auth` module) and included in API requests
3. Backend middleware `authenticateToken.js` validates JWT on protected routes
4. Router navigation guards (in `client/src/router/index.js`) protect routes based on auth state

### API Communication

- **Frontend**: Services in `client/src/services/` handle all API calls via Axios
- **Base service**: `ApiService.js` configures Axios with base URL and token injection
- **Specific services**: ClassesService, TextbooksService, etc. wrap API endpoints
- **Vite proxy**: In development, `/api` requests are proxied to `http://localhost:3001`

### State Management (Vuex)

All Vuex modules follow a similar pattern:
- `state`: Data storage
- `getters`: Computed properties
- `mutations`: Synchronous state changes
- `actions`: Async operations (API calls, then commit mutations)

**Key modules:**
- `auth`: User authentication state
- `classes`: Class management
- `schedule`: Weekly/daily schedule data
- `templates`: Schedule templates
- `daysOff`: Personal days off
- `exceptionPatterns`: Schedule exceptions
- `globalSettings`: App-wide settings (admin only)

### Database Models & Relationships

**Core models** (in `server/models/`):
- `user.js`: Users with authentication
- `class.js`: Classes/subjects (belongs to user)
- `textbook.js`: Textbooks (belongs to user)
- `dayoff.js`: Personal days off (belongs to user)
- `exceptionpattern.js`: Schedule exception templates
- `appliedexception.js`: Applied schedule exceptions
- `globalsetting.js`: System-wide settings
- `globaldayoff.js`: System-wide holidays

**Associations** are defined in each model's `associate()` method. The models use Sequelize's auto-loading pattern via `models/index.js`.

### Environment Configuration

**Root `.env`**: Main environment variables for Docker Compose
**Server `.env`**: Backend-specific config (JWT_SECRET, DATABASE_URL, etc.)
**Client `.env.development`/`.env.production`**: Frontend environment variables (VITE_API_URL)

In development: Server runs on port 3001, client on 5173, database on 5433 (host)
In production: Server on 3001, client on 80 (nginx), database on 5433 (host)

### Docker/Podman Setup

Two compose files:
- **`podman-compose.dev.yml`**: Development with volume mounts for hot-reload
- **`podman-compose.yml`**: Production with optimized builds

All services use `scheduler-network` bridge network for inter-container communication.

## Common Patterns

### Adding a New API Endpoint

1. Create route handler in `server/routes/` (or add to existing route file)
2. Apply `authenticateToken` middleware for protected routes
3. Import and mount route in `server/server.js`
4. Create corresponding service method in `client/src/services/`
5. Add Vuex action in appropriate module to call the service
6. Use the action in Vue components

### Adding a New Vuex Module

1. Create module file in `client/src/store/modules/`
2. Define state, getters, mutations, and actions
3. Import and register in `client/src/store/index.js`

### Creating a Database Migration

```bash
cd server
npx sequelize-cli migration:generate --name your-migration-name
# Edit the generated file in server/migrations/
yarn db:migrate
```

## Important Notes

- **Authentication**: All protected API routes use the `authenticateToken` middleware
- **CORS**: Configured in `server/server.js` to allow requests from CLIENT_URL
- **Database host**: Use `db` as host when running in Docker, `localhost` when running locally
- **Port mappings**:
  - Dev: Client (5173), Server (3001→3000), DB (5433→5432)
  - Prod: Client (80), Server (3001→3000), DB (5433→5432)
- **Schedule data**: Stored as JSON in user table (`regularSchedule` column)
- **Global vs Personal data**: Some features have both global (admin-set) and personal versions (e.g., days off, exceptions)

## Deployment

The project uses separate Docker builds for development and production:
- **Development**: Multi-stage Dockerfile with `target: development` for hot-reload
- **Production**: Client builds to static files served by Nginx; server runs with `yarn start`

Use `./scripts/manage.sh start:prod` to run the production build locally for testing before deploying to VPS.
