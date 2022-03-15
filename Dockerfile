FROM node:16

WORKDIR /usr/src/app

COPY . .

RUN npm install

# # install bash
# RUN apt-get install bash

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# add knex to the path
ENV PATH="~/node_modules/.bin/:${PATH}"

EXPOSE $PORT

CMD ["npm", "run", "start"]