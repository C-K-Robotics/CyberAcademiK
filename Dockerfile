# Development container only — use `docker compose up`, not a bare `docker build`.
#
# This image deliberately contains no application source: only the manifests are
# copied, so the layer cache survives content and code edits. docker-compose.yml
# bind-mounts the repo over /app (with an anonymous volume masking
# /app/node_modules so the host's copy never shadows the installed one), which is
# what supplies the code at run time. An image built on its own has dependencies
# but nothing to serve, and `yarn dev` will fail.
#
# Production is not built here at all — GitHub Actions runs `yarn build` and
# publishes dist/ to Pages (see .github/workflows/deploy.yml).
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

EXPOSE 5173
# Run dev server. 
# --host 0.0.0.0 allows external connections from host machine
CMD ["yarn", "dev", "--host", "0.0.0.0"]
