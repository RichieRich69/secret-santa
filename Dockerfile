# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build arguments for environment variables
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ARG FIREBASE_MEASUREMENT_ID

# Build the application
# The build script runs 'node scripts/set-env.js' automatically, which uses the ARGs above
RUN npm run build -- --configuration production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the previous stage
# Note: Angular 17+ application builder outputs to dist/<project-name>/browser
COPY --from=build /app/dist/secret-santa/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
