// Jenkinsfile for Windows Jenkins
pipeline {
    agent any
    
    environment {
        // Change this to your Docker Hub username
        DOCKER_REGISTRY = 'your-dockerhub-username'
        IMAGE_NAME = 'weather-app'
        CONTAINER_NAME = 'weather-app-prod'
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
                echo '✅ Code checked out successfully from GitHub'
                
                // Show what files we have
                bat 'dir'
            }
        }
        
        stage('Validate Files') {
            steps {
                script {
                    echo '🔍 Validating required files...'
                    
                    // Check if required files exist
                    def files = findFiles(glob: '*')
                    def requiredFiles = ['index.html', 'style.css', 'script.js', 'Dockerfile']
                    def missingFiles = []
                    
                    requiredFiles.each { file ->
                        if (!fileExists(file)) {
                            missingFiles.add(file)
                        }
                    }
                    
                    if (missingFiles) {
                        error "❌ Missing required files: ${missingFiles}"
                    } else {
                        echo '✅ All required files present'
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo '🐳 Building Docker image...'
                    
                    // For Windows, use docker build with --platform if needed
                    bat """
                        docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .
                        docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    """
                    
                    echo "✅ Image built: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Test Docker Image') {
            steps {
                script {
                    echo '🧪 Testing Docker image...'
                    
                    bat """
                        @echo off
                        
                        echo Stopping any existing test container...
                        docker stop weather-test 2>nul || echo No existing container
                        docker rm weather-test 2>nul || echo No container to remove
                        
                        echo Running new test container...
                        docker run -d --name weather-test -p 8080:80 ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                        
                        timeout /t 10 /nobreak >nul
                        
                        echo Checking if container is running...
                        docker ps --filter "name=weather-test"
                        
                        echo Testing website...
                        curl -f http://localhost:8080/ || (
                            echo ❌ Website test failed
                            exit 1
                        )
                        
                        echo ✅ Website test passed!
                        
                        echo Cleaning up...
                        docker stop weather-test
                        docker rm weather-test
                    """
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    echo '⬆️ Pushing to Docker Hub...'
                    
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        bat """
                            @echo off
                            
                            echo Logging in to Docker Hub...
                            echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin
                            
                            echo Pushing images...
                            docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                            
                            echo ✅ Images pushed to Docker Hub
                        """
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                script {
                    echo '🚀 Deploying to production...'
                    
                    bat """
                        @echo off
                        
                        echo Stopping old container if exists...
                        docker stop ${CONTAINER_NAME} 2>nul || echo No old container found
                        docker rm ${CONTAINER_NAME} 2>nul || echo No container to remove
                        
                        echo Running new container...
                        docker run -d ^
                            --name ${CONTAINER_NAME} ^
                            -p 80:80 ^
                            --restart unless-stopped ^
                            ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                        
                        timeout /t 5 /nobreak >nul
                        
                        echo ✅ Container deployed: ${CONTAINER_NAME}
                        
                        echo Container status:
                        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                        
                        echo.
                        echo 🌐 Your weather app is now live at:
                        echo http://localhost:80
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
            - Build Number: ${BUILD_NUMBER}
            - Container: ${CONTAINER_NAME}
            - Port: 80
            - Docker Image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
            
            ⏰ Build Time: ${currentBuild.durationString}
            """
        }
        
        failure {
            echo '❌ Pipeline failed! Check the logs above for errors.'
            
            // Clean up on failure
            bat """
                @echo off
                echo Cleaning up failed deployment...
                docker stop ${CONTAINER_NAME} 2>nul || echo No container to stop
                docker rm ${CONTAINER_NAME} 2>nul || echo No container to remove
            """
        }
        
        always {
            echo '🧹 Cleaning up...'
            
            // Clean up test containers
            bat """
                @echo off
                docker stop weather-test 2>nul || echo.
                docker rm weather-test 2>nul || echo.
                
                echo Removing dangling images...
                docker image prune -f 2>nul || echo.
            """
        }
    }
}