FROM node:18

WORKDIR /usr/src/server

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY ./controllers ./controllers
COPY ./services ./services
COPY ./frontend/build ./frontend/build
COPY ./mongo ./mongo
COPY ./gameplay ./gameplay
COPY ./validation.js ./
COPY ./server.js ./
COPY ./secret.txt ./

CMD [ "node", "server.js"];