# Use official Node LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install PM2 globally
RUN npm install -g pm2

# Copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy environment variables (optional local .env for docker build). If you don't want secrets baked in image, provide via -e or --env-file at docker run.
COPY .env .env

# Copy app source
COPY . ./

# Set production env by default
ENV NODE_ENV=production
ENV PORT=3000

# Expose default port (override as needed)
EXPOSE 3000

# Use pm2-runtime for production process management
CMD ["pm2-runtime", "--name", "klh-methodology-service", "server.js"]
