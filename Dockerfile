# Use Windows-compatible base image
FROM nginx:alpine

# For Windows, use forward slashes
WORKDIR /usr/share/nginx/html

# Copy files
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY img/ /usr/share/nginx/html/img/

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]