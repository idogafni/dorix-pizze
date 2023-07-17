# Dockerfile

# Stage 1 - the build process
FROM node:14-alpine as build-deps

WORKDIR /usr/src/app

COPY package*.json ./
COPY .env ./
RUN npm install

COPY . ./app

CMD ["node", "app.js"]