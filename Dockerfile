FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# copy local source files into docker image
COPY . .
RUN npm run build

FROM cgr.dev/chainguard/node:latest

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["dist/app.js"]
