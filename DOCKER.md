# Docker deployment — Cognitive Care NER Demo Unit

The repository contains a Dockerfile that packages the current static Demo Unit from `prototype/phase-0` behind Nginx.

## Local Docker

Build:

```bash
docker build -t cognitive-care-ner-demo .
```

Run:

```bash
docker run --rm -p 8080:80 cognitive-care-ner-demo
```

Open `http://localhost:8080`.

## Docker Compose

```bash
docker compose up --build
```

Open `http://localhost:8080`.

Stop it with:

```bash
docker compose down
```

## ZopDay

Use this repository and the `develop` branch for the current Demo Unit. Configure the deployment to build from the repository root using `Dockerfile`, expose container port `80`, and publish the resulting HTTP service. No application environment variables are required for the current static demo.

The Docker image intentionally contains only the demo assets; future backend/API services should be deployed separately and connected through environment configuration rather than embedded into this image.
