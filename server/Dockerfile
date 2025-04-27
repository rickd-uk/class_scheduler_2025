# Use a Debian-based Node.js image for better native addon compatibility
FROM node:18-slim AS base

# Set the working directory in the container
WORKDIR /usr/src/app

# -- Dependencies Stage --
FROM base AS deps
# Copy package.json and yarn.lock first for layer caching
COPY package.json yarn.lock ./
# Install dependencies using Yarn
RUN yarn install --frozen-lockfile --ignore-engines # Add --ignore-engines just in case

# -- Development Stage --
# (Used when running docker-compose up without production build)
FROM base AS development
# Copy installed dependencies from the 'deps' stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .
# Expose the port the app runs on (should match PORT in .env)
EXPOSE 3000
# Command to run the app using nodemon for development
CMD ["yarn", "dev"] # Assumes a "dev": "nodemon server.js" script in package.json

# -- Production Build Stage (Optional, if you have a build step) --
# FROM deps AS build
# COPY . .
# RUN yarn build # Example build command

# -- Production Stage (Optional) --
# FROM base AS production
# ENV NODE_ENV=production
# COPY --from=build /usr/src/app/dist ./dist # Copy build artifacts
# COPY --from=deps /usr/src/app/node_modules ./node_modules
# COPY package.json .
# EXPOSE 3000
# CMD ["node", "dist/server.js"] # Command to run production build

