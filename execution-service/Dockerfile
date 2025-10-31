# ---- Stage 1: build dependencies ----
FROM python:3.12-alpine AS builder

# Install build deps (only here, won't ship to final image)
RUN apk add --no-cache nodejs npm build-base python3-dev

WORKDIR /app

# ---------- JS workspace setup ----------
RUN mkdir -p /app/js_workspace
WORKDIR /app/js_workspace

# Create minimal package.json and install only what we need
RUN npm init -y && \
    npm install --omit=dev ethers@6 web3@4 axios arkiv-sdk dotenv

# ---------- Python deps setup ----------
WORKDIR /app
COPY execution-service/requirements.txt /app/requirements.txt

# We install python deps into a local folder so we can copy them later
RUN pip install --no-cache-dir --prefix=/install -r /app/requirements.txt

# Copy application source
COPY execution-service/main.py /app/main.py

# ---- Stage 2: runtime image ----
FROM python:3.12-alpine

# Create an unprivileged user and group with a high UID/GID
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install Node.js and npm for JavaScript execution
RUN apk add --no-cache nodejs npm

# Copy node_modules from builder stage
COPY --from=builder /app/js_workspace /app/js_workspace

# Copy python site-packages from builder stage into /usr/local
COPY --from=builder /install /usr/local

# Copy application code
COPY --from=builder /app/main.py /app/main.py

# Make sure files are owned by the unprivileged user, not root
RUN chown -R appuser:appgroup /app /usr/local

# Reduce default permissions a bit (read+execute for group, no world write)
RUN chmod -R g-w,o-w /app /usr/local

# Set NODE_PATH for global module access
ENV NODE_PATH=/app/js_workspace/node_modules

# Drop privileges
USER appuser

# Expose port
EXPOSE 8001

# create a writable runtime dir explicitly.
RUN mkdir -p /tmp/runtime && chmod 700 /tmp/runtime

# Run the application
CMD ["python", "main.py"]
