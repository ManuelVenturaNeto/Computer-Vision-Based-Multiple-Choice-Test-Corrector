FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build:prod \
 && npm prune --omit=dev


FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build/server ./build/server

EXPOSE 8080

USER node

CMD ["node", "build/server/index.js"]
