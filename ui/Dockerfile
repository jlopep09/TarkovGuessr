FROM node:22.13.1-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g npm@10.2.3

COPY . .
EXPOSE 5173

CMD ["npm", "run", "dev"]