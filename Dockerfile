FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY prototype/phase-0/ ./prototype/phase-0/
ENV PORT=80
EXPOSE 80
CMD ["node","server.js"]
