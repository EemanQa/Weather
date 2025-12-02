// Jenkinsfile
pipeline {
    agent any
    
    environment {
        // Change these to match your Docker Hub
        DOCKER_REGISTRY = 'your-dockerhub-username'  // Replace with your Docker Hub username
        IMAGE_NAME = 'weather-app'
        CONTAINER_NAME = 'weather-app-prod'
        PORT = '80'
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
                echo '✅ Code checked out successfully from GitHub'
                
                // Show what files we have
                sh 'ls -la'
            }
        }
        
        stage('Validate Files') {
            steps {
                script {
                    // Check if required files exist
                    def requiredFiles = ['index.html', 'style.css', 'script.js', 'Dockerfile']
                    requiredFiles.each { file ->
                        if (!fileExists(file)) {
                            error "❌ Missing required file: ${file}"
                        }
                    }
                    
                    echo '✅ All required files present'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo '🐳 Building Docker image...'
                    
                    // Tag with build number and timestamp
                    def timestamp = sh(script: 'date +%Y%m%d%H%M%S', returnStdout: true).trim()
                    def imageTag = "${BUILD_NUMBER}-${timestamp}"
                    
                    // Build the image
                    docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${imageTag}")
                    
                    // Also tag as latest
                    sh """
                        docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${imageTag} \
                               ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    """
                    
                    echo "✅ Image built: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${imageTag}"
                }
            }
        }
        
        stage('Test Docker Image') {
            steps {
                script {
                    echo '🧪 Testing Docker image...'
                    
                    sh """
                        # Run container for testing
                        docker run -d --name weather-test -p 8080:80 \
                            ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                        
                        # Wait for container to start
                        sleep 5
                        
                        # Check if container is running
                        docker ps | grep weather-test
                        
                        # Test if website is accessible
                        echo "Testing website availability..."
                        curl -f http://localhost:8080 || exit 1
                        
                        # Check if index.html is served
                        echo "Checking HTML content..."
                        curl -s http://localhost:8080 | grep -q "Weather app" && echo "✅ HTML content verified"
                        
                        # Check static files
                        echo "Checking CSS file..."
                        curl -f http://localhost:8080/style.css && echo "✅ CSS file found"
                        
                        # Clean up test container
                        docker stop weather-test
                        docker rm weather-test
                        
                        echo "✅ All tests passed!"
                    """
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    echo '⬆️ Pushing to Docker Hub...'
                    
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-credentials',  // Create this in Jenkins
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        sh """
                            # Login to Docker Hub
                            echo \${DOCKER_PASSWORD} | docker login -u \${DOCKER_USERNAME} --password-stdin
                            
                            # Push images
                            docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                            
                            echo "✅ Images pushed to Docker Hub"
                        """
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                script {
                    echo '🚀 Deploying to production...'
                    
                    sh """
                        # Stop and remove old container if exists
                        docker stop ${CONTAINER_NAME} 2>/dev/null || true
                        docker rm ${CONTAINER_NAME} 2>/dev/null || true
                        
                        # Pull latest image (or use local one)
                        docker pull ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest || echo "Using local image"
                        
                        # Run new container
                        docker run -d \\
                            --name ${CONTAINER_NAME} \\
                            -p ${PORT}:80 \\
                            --restart unless-stopped \\
                            ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                        
                        echo "✅ Container deployed: ${CONTAINER_NAME}"
                        
                        # Verify deployment
                        sleep 3
                        curl -f http://localhost:${PORT} && echo "✅ Website is live!"
                        
                        # Show container info
                        echo "\\n📊 Container Status:"
                        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                    """
                }
            }
        }
        
        stage('Post-Deployment Check') {
            steps {
                script {
                    echo '🔍 Running post-deployment checks...'
                    
                    sh """
                        # Check container logs
                        echo "\\n📝 Recent logs:"
                        docker logs --tail 10 ${CONTAINER_NAME}
                        
                        # Check container health
                        echo "\\n🏥 Container health:"
                        docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} || echo "No health check configured"
                        
                        # Check resource usage
                        echo "\\n💾 Resource usage:"
                        docker stats ${CONTAINER_NAME} --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo """
            🎉 Pipeline completed successfully!
            
            📍 Deployment Details:
            - Application: Weather App
            - Version: Build #${BUILD_NUMBER}
            - Container: ${CONTAINER_NAME}
            - Port: ${PORT}
            - Access: http://your-server-ip:${PORT}
            - Docker Image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
            
            ⏰ Build Time: ${currentBuild.durationString}
            """
            
            // Optional: Send notification
            // emailext (
            //     subject: "SUCCESS: Weather App Deployed - Build #${BUILD_NUMBER}",
            //     body: "Weather App has been successfully deployed.\n\nView build: ${BUILD_URL}",
            //     to: 'your-email@example.com'
            // )
        }
        
        failure {
            echo '❌ Pipeline failed! Check the logs above for errors.'
            
            // Optional rollback
            sh """
                echo "Attempting rollback..."
                docker stop ${CONTAINER_NAME} 2>/dev/null || true
                # You could add logic to rollback to previous version here
            """
        }
        
        always {
            echo '🧹 Cleaning up workspace...'
            cleanWs()
            
            // Clean up any dangling images
            sh 'docker image prune -f 2>/dev/null || true'
        }
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
}