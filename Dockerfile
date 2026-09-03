FROM nginx:1.27-alpine

# Serve the static Demo Unit from prototype/phase-0.
COPY prototype/phase-0/ /usr/share/nginx/html/

# Use the repo's Nginx config so SPA fallback and /health work correctly.
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
