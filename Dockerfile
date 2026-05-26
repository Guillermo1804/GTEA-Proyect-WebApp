FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npx ng build --configuration production

FROM nginx:alpine

COPY --from=builder /app/dist/GTEA-Proyect-WebApp/browser \
     /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
