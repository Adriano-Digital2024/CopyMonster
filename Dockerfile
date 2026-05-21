FROM node:18-alpine AS builder
WORKDIR /app

# Define build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY

ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}


# Set environment variables from build arguments so Vite can use them
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:18-alpine
WORKDIR /app

# Install 'serve' to host the static files from the build
RUN npm install -g serve

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app will run on
EXPOSE 3030

# Command to run the app on port 3030
CMD ["serve", "-s", "dist", "-l", "3030"]
