# BUILD
FROM node:20.14.0-alpine AS builder

USER node

WORKDIR /app

COPY yarn.lock package*.json ./
COPY tsconfig.json ./
COPY src/ src/
RUN yarn install
RUN yarn build


# PRODUCTION
FROM node:20.14.0-alpine

WORKDIR /app

COPY package*.json ./

RUN yarn install --only=production

COPY --from=builder /app/dist ./


EXPOSE 9000
ENTRYPOINT ["node","./index.js"]