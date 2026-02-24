# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install deps (include dev deps for builds)
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package*.json ./

# Set environment
ENV NODE_ENV=production

# Use non-root user
USER node

# Expose backend port (5000)
EXPOSE 5000

# Start the app
CMD ["node", "src/server.js"]
