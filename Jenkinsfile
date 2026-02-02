pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/atul-kaka/nagarparishad-backend.git']]
                ])
            }
        }

        stage('Build') {
            steps {
                sh 'npm install' // if you have a build step
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    pm2 reload ecosystem.config.js --env production
                    pm2 save
                    pm2 startup
                '''
    }
        }
    }
}
