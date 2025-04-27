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
# Use --host to expose to the network within Docker
CMD ["yarn", "dev", "--host"]

# -- Production Build Stage (Optional) --
# FROM deps AS build
# COPY . .
# # Pass build-time environment variables if needed
# ARG VITE_API_URL
# ENV VITE_API_URL=${VITE_API_URL}
# RUN yarn build

# -- Production Serve Stage (Optional, using a static server like Nginx) --
# FROM nginx:stable-alpine AS production
# ENV NODE_ENV=production
# COPY --from=build /usr/src/app/dist /usr/share/nginx/html
# # Copy nginx config file if needed
# # COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

