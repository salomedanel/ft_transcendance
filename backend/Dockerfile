# Use an official Node runtime as a parent image
FROM node:lts

# Set the working directory in the container to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in package.json
RUN npm install

# Expose port 3333 for your backend application
EXPOSE 3333


# Run your application
CMD npx prisma migrate dev && npm run start:dev