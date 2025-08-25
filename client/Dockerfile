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

# -- Production Build Stage --
# This stage builds the static files
FROM deps AS build
COPY . .
# Pass build-time environment variables if needed
# ARG VITE_API_URL
# ENV VITE_API_URL=${VITE_API_URL}
RUN yarn build

# -- Production Serve Stage --
# This stage uses Nginx to serve the built files
FROM nginx:stable-alpine AS production
ENV NODE_ENV=production
# Copy the built files from the 'build' stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
# Copy nginx config file if needed (optional for now)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
