FROM node:20-alpine

WORKDIR /app

# Keep the runtime image deterministic and minimal. The browser prototype has
# no runtime npm dependency; server.js uses Node 20's built-in fetch().
COPY package.json ./
COPY server.js ./
COPY *.html *.js *.css *.webmanifest ./
COPY auth-accounts.csv ./auth-accounts.csv

ENV NODE_ENV=production
ENV PORT=80
ENV BUILD_VERSION=0.20.3

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=2s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||80)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node","server.js"]
