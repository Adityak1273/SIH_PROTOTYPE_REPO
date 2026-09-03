FROM nginx:1.27-alpine

# Serve the static Demo Unit from prototype/phase-0.
COPY prototype/phase-0/ /usr/share/nginx/html/

# Basic container health check without requiring curl/wget in the image.
RUN printf '%s\n' '<!doctype html><html><head><meta charset="utf-8"><title>ok</title></head><body>ok</body></html>' > /usr/share/nginx/html/health.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
