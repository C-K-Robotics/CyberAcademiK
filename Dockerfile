FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

EXPOSE 5173
# Run dev server. 
# --host 0.0.0.0 allows external connections from host machine
CMD ["yarn", "dev", "--host", "0.0.0.0"]
