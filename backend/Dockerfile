FROM node:20-alpine

WORKDIR /app

# sharp needs build tools
RUN apk add --no-cache python3 make g++

# Install all deps (including pino-pretty for readable logs)
COPY package.json ./
RUN npm install

# Copy source
COPY src/ ./src/

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "src/server.js"]
