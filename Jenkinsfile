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
                sh 'npm run build' // if you have a build step
            }
        }

        stage('Deploy') {
            steps {
                // Stop old instance
               sh 'npm run pm2:stop'
                
                // Start new instance
                sh 'npm run pm2:start'
                
                // Save PM2 process list
                sh 'pm2 save'
            }
        }
    }
}
