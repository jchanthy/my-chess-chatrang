# Stage 1: Build Fairy-Stockfish from source
FROM debian:bookworm-slim AS build-engine

RUN apt-get update && apt-get install -y \
    git \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Clone Fairy-Stockfish (shallow clone to be fast)
RUN git clone --depth 1 https://github.com/fairy-stockfish/Fairy-Stockfish.git /tmp/fairy-stockfish

# Build Fairy-Stockfish for standard x86-64 compatibility
WORKDIR /tmp/fairy-stockfish/src
RUN make -j$(nproc) build ARCH=x86-64

# Stage 2: Runtime Node.js container
FROM node:20-slim

WORKDIR /app

# Copy Fairy-Stockfish compiled binary from stage 1
COPY --from=build-engine /tmp/fairy-stockfish/src/stockfish /usr/local/bin/fairy-stockfish
RUN chmod +x /usr/local/bin/fairy-stockfish

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy express server code
COPY server.js ./

# Set environment variables
ENV ENGINE_PATH=/usr/local/bin/fairy-stockfish
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
