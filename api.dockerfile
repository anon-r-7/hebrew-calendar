# Define a base stage
FROM node:20-alpine AS base

WORKDIR /app
COPY . .
RUN yarn

# Development stage
FROM base AS dev
WORKDIR /app/packages/api
ENTRYPOINT [ "sh", "entrypoint.sh", "start"]

# Production stage
FROM base AS prod
LABEL org.opencontainers.image.source=https://github.com/anon-r-7/hebrew-calendar
WORKDIR /app/packages/api
RUN yarn build
ENTRYPOINT [ "sh", "entrypoint.sh", "serve"]
