FROM node:18

WORKDIR /usr/src/chess_server/game_server

COPY ./game_server/package.json ../
COPY ./game_server/package-lock.json ../

RUN npm install

COPY ./gameplay ../gameplay

COPY ./mongo ../mongo
COPY ./game_server/game_server_service.js ./
COPY ./game_server/game_server.js ./

CMD [ "node", "game_server.js"];
