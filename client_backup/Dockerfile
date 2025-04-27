FROM node:16-alpine

# Install Yarn
RUN apk add --no-cache yarn

# Create app directory
WORKDIR /app

# Copy package.json and yarn.lock (if exists)
COPY package.json ./
COPY yarn.lock ./

# Install app dependencies
RUN yarn install --frozen-lockfile

# Copy app source code
COPY . .

# Expose port
EXPOSE 8080

# Start command
CMD ["yarn", "serve"]
