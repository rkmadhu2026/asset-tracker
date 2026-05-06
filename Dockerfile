# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG GEMINI_API_KEY=
ARG AUTH_BYPASS=
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV AUTH_BYPASS=${AUTH_BYPASS}

RUN echo "GEMINI_API_KEY=${GEMINI_API_KEY}" > .env && \
    echo "AUTH_BYPASS=${AUTH_BYPASS}" >> .env

RUN npm run build

FROM nginx:alpine AS web
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
