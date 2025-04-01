pipeline {
    agent {
        docker {
            image 'node:18-alpine'
            args '-p 5000:5000'
        }
    }
    
    environment {
        CI = 'true'
        NODE_ENV = 'test'
        MONGO_URI = credentials('mongodb-uri-test')
        JWT_SECRET = credentials('jwt-secret')
        DOCKER_REGISTRY = credentials('docker-registry')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint || echo "No linting configured"'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('SonarQube Analysis') {
            when {
                branch 'main'
            }
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'npm install sonarqube-scanner --save-dev'
                    sh 'npx sonarqube-scanner -Dsonar.projectKey=pocketlegal-backend -Dsonar.sources=src'
                }
            }
        }
        
        stage('Build and Push Docker Image') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker build -t $DOCKER_REGISTRY/pocketlegal-backend:$BUILD_NUMBER .'
                sh 'docker tag $DOCKER_REGISTRY/pocketlegal-backend:$BUILD_NUMBER $DOCKER_REGISTRY/pocketlegal-backend:latest'
                sh 'echo $DOCKER_REGISTRY_PSW | docker login -u $DOCKER_REGISTRY_USR --password-stdin'
                sh 'docker push $DOCKER_REGISTRY/pocketlegal-backend:$BUILD_NUMBER'
                sh 'docker push $DOCKER_REGISTRY/pocketlegal-backend:latest'
            }
        }
        
        stage('Deploy to Development') {
            when {
                branch 'develop'
            }
            steps {
                withKubeConfig([credentialsId: 'kubeconfig']) {
                    sh 'sed -i "s|{{IMAGE_TAG}}|$BUILD_NUMBER|g" kubernetes/deployment.yaml'
                    sh 'kubectl apply -f kubernetes/deployment.yaml -n development'
                    sh 'kubectl apply -f kubernetes/service.yaml -n development'
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'staging'
            }
            steps {
                withKubeConfig([credentialsId: 'kubeconfig']) {
                    sh 'sed -i "s|{{IMAGE_TAG}}|$BUILD_NUMBER|g" kubernetes/deployment.yaml'
                    sh 'kubectl apply -f kubernetes/deployment.yaml -n staging'
                    sh 'kubectl apply -f kubernetes/service.yaml -n staging'
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message "Deploy to production?"
                ok "Yes, deploy it!"
            }
            steps {
                withKubeConfig([credentialsId: 'kubeconfig']) {
                    sh 'sed -i "s|{{IMAGE_TAG}}|$BUILD_NUMBER|g" kubernetes/deployment.yaml'
                    sh 'kubectl apply -f kubernetes/deployment.yaml -n production'
                    sh 'kubectl apply -f kubernetes/service.yaml -n production'
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            // Add notification logic here (email, Slack, etc.)
        }
        always {
            // Clean up workspace
            cleanWs()
        }
    }
} 