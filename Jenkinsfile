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
                      rsync -av --delete \
                        /var/lib/jenkins/workspace/PRAMAAN-BACKEND_main/ \
                        /var/www/pramaan-backend/

                      cd /var/www/pramaan-backend
                      pm2 reload ecosystem.config.js --env production
                '''
            }
        }
    }
}
