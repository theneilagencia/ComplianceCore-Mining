FROM node:22-alpine

# Install bash and pnpm
RUN apk add --no-cache bash
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application (with timestamp to bust cache)
ARG CACHE_BUST=unknown
RUN echo "Building at: $CACHE_BUST" && bash build.sh

# Expose port (Render uses PORT env var, default to 10000)
EXPOSE 10000

# Copy startup script
COPY start-with-migrations.sh ./
RUN chmod +x start-with-migrations.sh

# Start application with migrations
CMD ["./start-with-migrations.sh"]

