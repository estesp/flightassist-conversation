FROM node:7-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

EXPOSE 6000

COPY package.json /usr/src/app
RUN npm install

COPY . /usr/src/app

ENTRYPOINT ["node", "app.js"]
