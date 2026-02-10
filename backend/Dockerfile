FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY . .

# Expose port
EXPOSE 8000

# Start app
CMD ["npm", "start"]
