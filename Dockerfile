# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies manifest
COPY package*.json ./

# Install all dependencies, including devDependencies for build step
RUN npm ci

# Copy all source files
COPY . .

# Run the unified build script (vite build + esbuild server.ts)
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the built output directory (client spa + bundled server)
COPY --from=builder /app/dist ./dist
# Copy essential files for package execution
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Render or container platforms will dynamically pass PORT, default to 3000
EXPOSE 3000

# Start command
CMD ["npm", "start"]
