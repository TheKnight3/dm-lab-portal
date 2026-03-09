FROM node:18-alpine as build

WORKDIR /app

# Install dependencies. Use legacy peer deps to avoid strict peer checks.
# Copy both package.json and the lock file to leverage caching when dependencies
# haven't changed.
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy application source
COPY . .

# Expose port for the Vite dev server / preview
EXPOSE 4200

# Default command runs the app in development mode. Use `npm run build` and a separate
# web server (e.g. nginx) for production builds if desired.
CMD ["npm", "start"]