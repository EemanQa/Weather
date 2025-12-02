// Jenkinsfile - Fixed version
pipeline {
    agent any
    
    environment {
        APP_PORT = '3000'
        DOCKER_REGISTRY = 'eemanqa'
        IMAGE_NAME = 'weather-app'
        CONTAINER_NAME = 'weather-app-prod'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo ✅ Code checked out from GitHub'
            }
        }
        
        stage('Validate Files') {
            steps {
                bat '''
                    echo 🔍 Checking required files...
                    dir
                    
                    if not exist index.html (
                        echo ❌ index.html not found!
                        exit 1
                    )
                    if not exist Dockerfile (
                        echo ❌ Dockerfile not found!
                        exit 1
                    )
                    
                    echo ✅ All files present
                '''
            }
        }
        
        stage('Build Docker Image') {
            steps {
                bat """
                    echo 🐳 Building Docker image...
                    docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .
                    docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    echo ✅ Image built: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                """
            }
        }
        
        stage('Test Deployment') {
            steps {
                bat """
                    echo 🧪 Testing deployment...
                    
                    docker stop weather-test 2>nul || echo.
                    docker rm weather-test 2>nul || echo.
                    
                    docker run -d --name weather-test -p 3001:80 ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    
                    timeout /t 10 /nobreak >nul
                    
                    curl -f http://localhost:3001 || (
                        echo ❌ Test failed! Checking logs...
                        docker logs weather-test
                        exit 1
                    )
                    
                    echo ✅ Test passed!
                    
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
                        echo ⬆️ Pushing to Docker Hub...
                        
                        echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin
                        
                        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                        
                        echo ✅ Images pushed to Docker Hub
                    """
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                bat """
                    echo 🚀 Deploying to production...
                    
                    docker stop ${CONTAINER_NAME} 2>nul || echo No old container found
                    docker rm ${CONTAINER_NAME} 2>nul || echo No container to remove
                    
                    docker run -d ^
                        --name ${CONTAINER_NAME} ^
                        -p ${APP_PORT}:80 ^
                        --restart unless-stopped ^
                        ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    
                    timeout /t 10 /nobreak >nul
                    
                    curl -f http://localhost:${APP_PORT} && echo ✅ Deployment successful!
                    
                    echo.
                    echo 📊 Deployment Information:
                    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                """
            }
        }
        
        stage('Health Check') {
            steps {
                bat """
                    echo 🏥 Running health checks...
                    
                    docker ps --filter "name=${CONTAINER_NAME}" | findstr "${CONTAINER_NAME}"
                    if errorlevel 1 (
                        echo ❌ Container is not running!
                        exit 1
                    )
                    
                    curl -f http://localhost:${APP_PORT}/index.html || (
                        echo ❌ Website not accessible!
                        exit 1
                    )
                    
                    curl -f http://localhost:${APP_PORT}/style.css && echo ✅ CSS accessible
                    curl -f http://localhost:${APP_PORT}/script.js && echo ✅ JavaScript accessible
                    
                    echo ✅ All health checks passed!
                """
            }
        }
    }
    
    post {
        success {
            script {
                currentBuild.description = "Weather App v${BUILD_NUMBER} on port ${APP_PORT}"
            }
            echo """
            🎉 Pipeline completed successfully!
            
            📍 Deployment Details:
            - Application: Weather App
            - Build Number: ${BUILD_NUMBER}
            - Container: ${CONTAINER_NAME}
            - Port: ${APP_PORT}
            - URL: http://localhost:${APP_PORT}
            - Docker Image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
            
            ⏰ Build Time: ${currentBuild.durationString}
            """
        }
        
        failure {
            echo '❌ Pipeline failed!'
            
            bat """
                echo Attempting cleanup...
                docker stop ${CONTAINER_NAME} 2>nul || echo.
                docker rm ${CONTAINER_NAME} 2>nul || echo.
                
                echo Last 20 lines of logs:
                docker logs --tail 20 ${CONTAINER_NAME} 2>nul || echo No logs available
            """
        }
        
        always {
            bat """
                echo 🧹 Cleaning up temporary containers...
                docker stop weather-test 2>nul || echo.
                docker rm weather-test 2>nul || echo.
                
                echo Removing unused images...
                docker image prune -f 2>nul || echo.
            """
        }
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
}