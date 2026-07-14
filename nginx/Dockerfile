# ---------- Build React ----------
FROM node:24-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build

# ---------- Runtime ----------
FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=frontend-builder \
    /frontend/dist \
    /usr/share/nginx/html