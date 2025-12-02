# Save this as Jenkinsfile in your project directory
@"
pipeline {
    agent any
    
    environment {
        APP_PORT = '3000'
        DOCKER_REGISTRY = 'eeman784'      // Your Docker Hub username
        IMAGE_NAME = 'weather-app'        // Your repo name
        CONTAINER_NAME = 'weather-app-prod'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo Code checked out from GitHub'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                bat """
                    echo Building Docker image...
                    docker build -t \${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER} .
                    docker tag \${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER} \${DOCKER_REGISTRY}/\${IMAGE_NAME}:latest
                    echo Image built: \${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER}
                """
            }
        }
        
        stage('Test Deployment') {
            steps {
                bat """
                    echo Testing deployment...
                    
                    docker stop weather-test 2>nul || echo.
                    docker rm weather-test 2>nul || echo.
                    
                    docker run -d --name weather-test -p 3001:80 \${DOCKER_REGISTRY}/\${IMAGE_NAME}:latest
                    
                    ping -n 10 127.0.0.1 >nul
                    
                    curl -f http://localhost:3001 || (
                        echo Test failed! Checking logs...
                        docker logs weather-test
                        exit 1
                    )
                    
                    echo Test passed!
                    
                    docker stop weather-test
                    docker rm weather-test
                """
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    bat """
                        echo Pushing to Docker Hub...
                        
                        echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin
                        
                        docker push \${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER}
                        docker push \${DOCKER_REGISTRY}/\${IMAGE_NAME}:latest
                        
                        echo Images pushed to Docker Hub
                    """
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                bat """
                    echo Deploying to production...
                    
                    docker stop \${CONTAINER_NAME} 2>nul || echo No old container found
                    docker rm \${CONTAINER_NAME} 2>nul || echo No container to remove
                    
                    docker run -d ^
                        --name \${CONTAINER_NAME} ^
                        -p \${APP_PORT}:80 ^
                        --restart unless-stopped ^
                        \${DOCKER_REGISTRY}/\${IMAGE_NAME}:latest
                    
                    ping -n 5 127.0.0.1 >nul
                    
                    curl -f http://localhost:\${APP_PORT} && echo Deployment successful!
                    
                    echo.
                    echo Deployment Information:
                    docker ps --filter "name=\${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                """
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Weather App deployed on http://localhost:3000"
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
"@ | Out-File Jenkinsfile -Encoding UTF8 -Force