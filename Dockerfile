# cue/Dockerfile
# Stage 1: Build (if you have a build step)
FROM node:18-alpine AS builder
WORKDIR /app

# If you need to build (e.g., Vite, webpack, etc.)
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build
# This should output to ./dist

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]