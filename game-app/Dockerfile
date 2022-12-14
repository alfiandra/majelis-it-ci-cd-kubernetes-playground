FROM node:16.10.0-alpine

COPY . .

RUN yarn install

EXPOSE 3000

RUN yarn build

CMD ["node", "build/index.js"]

ENV APP_VERSION=v2.0.0
