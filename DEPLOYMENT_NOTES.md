# Deployment Notes

## Environment Configuration Summary

This project is configured to work in both **development** (local Docker) and **production** (Linode server) environments.

### How API Requests Work

**Development Environment:**
- Browser makes requests to `/api/...`
- Vite dev server (running in Docker) proxies these to `http://scheduler-server-dev:3000/api/...`
- The backend server is accessed using the Docker container name

**Production Environment:**
- Browser makes requests to `/api/...`
- Nginx (serving the built Vue app) proxies these to `http://scheduler-server:3000/api/...`
- The backend server is accessed using the Docker container name
- Static files are served directly by Nginx

### Key Configuration Files

#### 1. `client/.env`
```
VITE_API_URL=/api
```
- Used by the Vue app to determine the API base URL
- Set to `/api` so requests are proxied (either by Vite in dev or Nginx in prod)

#### 2. `client/.env.development`
```
VITE_API_URL=/api
```
- Development-specific override (same as .env)

#### 3. `client/.env.production`
```
VITE_API_URL=/api
```
- Production-specific override (same as .env)

#### 4. `client/vite.config.js`
- Configured to proxy `/api` requests to the backend
- Uses `VITE_PROXY_TARGET` environment variable or defaults to `http://scheduler-server-dev:3000`
- In development: Vite dev server handles proxying
- In production build: This config is not used (Nginx handles everything)

#### 5. `client/nginx.conf`
- Production-only Nginx configuration
- Serves static files from `/usr/share/nginx/html`
- Proxies `/api/*` requests to `http://scheduler-server:3000/api/`
- Handles SPA routing with `try_files`

#### 6. `client/Dockerfile`
- Multi-stage build with separate `development` and `production` stages
- Development stage: Runs Vite dev server
- Production stage: Builds static files and serves with Nginx using custom nginx.conf

### Docker Container Names

**Development (podman-compose.dev.yml):**
- Database: `scheduler-db-dev`
- Server: `scheduler-server-dev`
- Client: `scheduler-client-dev`

**Production (podman-compose.yml):**
- Database: `scheduler-db`
- Server: `scheduler-server`
- Client: `scheduler-client`

### Port Mappings

**Development:**
- Client: `5173:5173` (Vite dev server)
- Server: `3001:3000` (Express API)
- Database: `5433:5432` (PostgreSQL)

**Production:**
- Client: `80:80` (Nginx)
- Server: `3001:3000` (Express API)
- Database: `5433:5432` (PostgreSQL)

### Deployment Workflow

1. **Local Development:**
   ```bash
   ./scripts/manage.sh start:dev
   ```
   Access app at http://localhost:5173

2. **Testing Production Build Locally:**
   ```bash
   ./scripts/manage.sh start:prod
   ```
   Access app at http://localhost:80

3. **Deploy to Linode:**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main

   # On Linode server:
   git pull origin main
   ./scripts/manage.sh stop:prod
   ./scripts/manage.sh start:prod
   ```

### Important Notes

- **Container networking:** Services communicate using container names, not `localhost`
- **Browser requests:** Always go through the proxy (Vite or Nginx), never directly to container names
- **Environment variables:** The `.env` files are NOT committed to git for security
- **Production .env:** Make sure your Linode server has a properly configured `.env` file in the project root
- **Database persistence:** Data is stored in Docker volumes (`postgres_data` or `postgres_data_dev`)

### Troubleshooting

**Issue:** 500 errors when making API requests
- Check if the proxy target is correct (container name vs localhost)
- Verify containers are on the same Docker network
- Check server logs: `podman logs scheduler-server-dev`

**Issue:** Connection refused errors
- Ensure all containers are running: `podman ps`
- Check that container names match the configuration
- Verify the Docker network exists and containers are connected

**Issue:** Changes not reflected in browser
- Hard refresh browser (Ctrl+Shift+R)
- Check if Vite restarted: `podman logs scheduler-client-dev`
- In production, rebuild: `./scripts/manage.sh stop:prod && ./scripts/manage.sh start:prod`
