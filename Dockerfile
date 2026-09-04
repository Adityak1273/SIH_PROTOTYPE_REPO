FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY prototype/phase-0/ ./prototype/phase-0/
ENV PORT=80
ENV BUILD_VERSION=0.13.0
EXPOSE 80
CMD ["node","server.js"]
