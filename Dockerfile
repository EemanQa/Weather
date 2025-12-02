# Dockerfile
# Use lightweight NGINX Alpine image
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create directory for custom NGINX config
RUN mkdir -p /etc/nginx/conf.d

# Copy custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy your website files
COPY . /usr/share/nginx/html

# Remove default NGINX index page
RUN rm -f /usr/share/nginx/html/index.html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]