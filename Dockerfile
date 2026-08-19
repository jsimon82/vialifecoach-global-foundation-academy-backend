# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
RUN node --input-type=module -e "import('cookie-parser')"

COPY . .

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/routes ./routes
COPY --from=build /app/services ./services
COPY --from=build /app/middlewares ./middlewares
COPY --from=build /app/config ./config
COPY --from=build /app/controllers ./controllers
COPY --from=build /app/utils ./utils
COPY --from=build /app/uploads ./uploads

USER node
EXPOSE 5000
CMD ["node", "src/server.js"]
