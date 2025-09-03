FROM node:22.14.0-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g npm@10.9.2
RUN npm audit fix

COPY . .
EXPOSE 5173

CMD ["npm", "run", "dev"]