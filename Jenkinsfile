pipeline {
    agent any
    
    environment {
        APP_PORT = '3000'
        DOCKER_REGISTRY = 'eeman784'
        IMAGE_NAME = 'weather-app'
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
                    docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .
                    docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    echo Image built: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                """
            }
        }
        
        stage('Test Deployment') {
            steps {
                bat """
                    echo Testing deployment...
                    
                    docker stop weather-test 2>nul || echo.
                    docker rm weather-test 2>nul || echo.
                    
                    docker run -d --name weather-test -p 3001:80 ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    
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
                        
                        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                        
                        echo Images pushed to Docker Hub
                    """
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                bat """
                    echo Deploying to production...
                    
                    docker stop ${CONTAINER_NAME} 2>nul || echo No old container found
                    docker rm ${CONTAINER_NAME} 2>nul || echo No container to remove
                    
                    docker run -d ^
                        --name ${CONTAINER_NAME} ^
                        -p ${APP_PORT}:80 ^
                        --restart unless-stopped ^
                        ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    
                    ping -n 5 127.0.0.1 >nul
                    
                    curl -f http://localhost:${APP_PORT} && echo Deployment successful!
                    
                    echo.
                    echo Deployment Information:
                    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                """
            }
        }
        
        stage('Setup Monitoring') {
            steps {
                bat """
                    echo 📊 Setting up monitoring stack...
                    
                    # Stop existing monitoring containers
                    docker-compose -f docker-compose.monitoring.yml down 2>nul || echo.
                    
                    # Start monitoring stack
                    docker-compose -f docker-compose.monitoring.yml up -d
                    
                    echo ✅ Monitoring stack started!
                    echo 📈 Prometheus: http://localhost:9090
                    echo 📊 Grafana: http://localhost:4000 (admin/admin123)
                """
            }
        }
        
        stage('Monitor Health') {
            steps {
                bat """
                    echo 🏥 Checking monitoring health...
                    
                    # Wait for monitoring to start
                    ping -n 20 127.0.0.1 >nul
                    
                    # Test Prometheus
                    curl -f http://localhost:9090 && echo ✅ Prometheus is up
                    
                    # Test Grafana
                    curl -f http://localhost:4000/api/health && echo ✅ Grafana is up
                    
                    # Test metrics endpoint
                    curl -f http://localhost:3000/metrics && echo ✅ Metrics endpoint is up
                    
                    echo 🎉 Monitoring setup complete!
                """
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Weather App deployed on http://localhost:3000"
            
            script {
                // Slack notification
                bat '''
                    ./notifications/slack-webhook.sh "✅ Deployment Successful! Weather App v${BUILD_NUMBER} deployed." "good"
                '''
                
                // Email notification
                emailext (
                    subject: "SUCCESS: Weather App Deployment #${BUILD_NUMBER}",
                    body: """
                    Weather App has been successfully deployed!
                    
                    Details:
                    - Build Number: ${BUILD_NUMBER}
                    - Status: ${currentBuild.result}
                    - URL: http://localhost:3000
                    - Prometheus: http://localhost:9090
                    - Grafana: http://localhost:4000 (admin/admin123)
                    
                    Build URL: ${BUILD_URL}
                    """,
                    to: 'your-email@example.com'
                )
            }
        }
        failure {
            echo 'Pipeline failed!'
            script {
                bat '''
                    ./notifications/slack-webhook.sh "❌ Deployment Failed! Check Jenkins logs." "danger"
                '''
            }
        }
    }
}