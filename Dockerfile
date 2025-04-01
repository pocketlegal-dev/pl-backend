# Use Node.js LTS as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Create log directory with correct ownership
RUN mkdir -p /usr/src/app/logs && \
    chown -R nodejs:nodejs /usr/src/app/logs

# Install dependencies only when needed
FROM base AS deps

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs . .

# Final stage for production image
FROM base AS runner

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built app
COPY --from=deps --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/src ./src
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/scripts ./scripts
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/server.js ./server.js

# Make health check script executable
RUN chmod +x scripts/healthcheck.js

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 5000

# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node scripts/healthcheck.js

# Command to run the application
CMD ["node", "server.js"] 