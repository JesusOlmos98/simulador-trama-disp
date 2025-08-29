# syntax=docker/dockerfile:1

############################
# Base con Yarn (Corepack) #
############################
FROM node:20-alpine AS base
WORKDIR /app
# Habilita Yarn clásico (v1) vía Corepack
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

############################
# Deps (incluye dev)       #
############################
FROM base AS deps
COPY package.json yarn.lock ./
# Si compilas addons nativos, descomenta:
# RUN apk add --no-cache python3 make g++
RUN yarn install --frozen-lockfile

############################
# Build (TS -> dist)       #
############################
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

################################
# Deps producción solamente     #
################################
FROM base AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

############################
# Runtime ligero           #
############################
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Usuario no-root
RUN addgroup -S app && adduser -S app -G app

# Copiamos sólo lo necesario para ejecutar
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build     /app/dist        ./dist
COPY package.json yarn.lock ./

# Puertos (HTTP Nest y TCP server)
ENV PORT=8001
ENV DESTINY_PORT=8010
ENV DESTINY_HOST=127.0.0.1
EXPOSE 8001 8010

USER app
CMD ["node", "dist/src/main.js"]


# Install dependencies only when needed
# FROM node:20-alpine AS deps
# # Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat
# WORKDIR /app
# COPY package.json yarn.lock ./
# RUN yarn install --frozen-lockfile

# # Build the app with cache dependencies
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# RUN yarn build

# # Production image, copy all the files and run next
# FROM node:20-alpine AS runner

# # Set working directory
# WORKDIR /usr/src/app

# COPY package.json yarn.lock ./

# RUN yarn install --prod

# COPY --from=builder /app/dist ./dist

# CMD [ "node","dist/main","dist/main.js" ]


# IA:

# Dockerfile
# syntax=docker/dockerfile:1

# FROM node:20-alpine AS deps
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci

# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# RUN npm run build

# FROM node:20-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production
# ENV PORT=8001
# COPY --from=builder /app/package*.json ./
# RUN npm ci --omit=dev
# COPY --from=builder /app/dist ./dist
# EXPOSE 8001
# CMD ["node", "dist/main.js"]

# Si usas Nest con script "start:prod", cambia a:
# CMD ["npm", "run", "start:prod"]
