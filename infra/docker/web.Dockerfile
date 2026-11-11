FROM node:22-alpine AS build

WORKDIR /srv

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/analysis/package.json packages/analysis/package.json
COPY packages/api-client/package.json packages/api-client/package.json

RUN npm ci

COPY apps/web apps/web
COPY packages/analysis packages/analysis
COPY packages/api-client packages/api-client

RUN npm run build

FROM nginx:1.27-alpine

COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /srv/apps/web/dist /usr/share/nginx/html

EXPOSE 80
