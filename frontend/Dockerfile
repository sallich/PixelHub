FROM node:22-alpine as build

WORKDIR /app

# Define build arguments
ARG NG_APP_API_BASE=/api
ARG NG_APP_CANVAS_WIDTH=2000
ARG NG_APP_CANVAS_HEIGHT=2000
ARG NG_APP_RATE_LIMIT_SECONDS=30

# Set them as environment variables for the build
ENV NG_APP_API_BASE=${NG_APP_API_BASE}
ENV NG_APP_CANVAS_WIDTH=${NG_APP_CANVAS_WIDTH}
ENV NG_APP_CANVAS_HEIGHT=${NG_APP_CANVAS_HEIGHT}
ENV NG_APP_RATE_LIMIT_SECONDS=${NG_APP_RATE_LIMIT_SECONDS}

# Copy package files for caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build with production configuration explicitly
RUN npm run build -- --configuration=production

FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
