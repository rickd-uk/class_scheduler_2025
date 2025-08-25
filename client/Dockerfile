# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

# Set the working directory
WORKDIR /usr/src/app

# -- Dependencies Stage --
FROM base AS deps
# Copy package.json and yarn.lock
COPY package.json yarn.lock ./
# Install dependencies
RUN yarn install --frozen-lockfile

# -- Development Stage --
FROM base AS development
# Copy installed dependencies
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .
# Expose the Vite default port
EXPOSE 5173
# Command to run the Vite dev server, accessible from host
CMD ["yarn", "dev", "--host"]

# -- Production Build Stage --
FROM deps AS build
COPY . .
RUN yarn build

# -- Production Serve Stage --
FROM nginx:stable-alpine AS production
ENV NODE_ENV=production
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
