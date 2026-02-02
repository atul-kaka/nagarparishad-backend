pipeline {
    agent any

    environment {
      DB_HOST     = credentials('DB_HOST')
      DB_PORT     = credentials('DB_PORT')
      DB_NAME     = credentials('DB_NAME')
      DB_USER = credentials('DB_USER')
      DB_PASSWORD = credentials('DB_PASSWORD')
      NODE_ENV    = credentials('NODE_ENV')
      ENCRYPTION_KEY = credentials('ENCRYPTION_KEY')
      ENABLE_ENCRYPTION = credentials('ENABLE_ENCRYPTION')
    }

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
                      set -e

                      sudo -u mcramtek-admin rsync -av --delete \
                      --no-owner --no-group --no-perms --no-times --omit-dir-times \
                      --exclude=.git/ \
                      --exclude=node_modules/ \
                      --exclude=logs/ \
                      --exclude=.pm2/ \
                      --exclude=.env.production \
                      --exclude=Jenkinsfile \
                      --exclude=.Jenkinsfile \
                      --exclude=package-lock.json \
                      /var/lib/jenkins/workspace/PRAMAAN-BACKEND_main/ \
                      /var/www/pramaan-backend/

                      echo "Creating .env.production"

                    sudo -u mcramtek-admin bash -c 'cat > /var/www/pramaan-backend/.env.production <<EOF
                    NODE_ENV=production
                    PORT=3000
                    DB_HOST=${DB_HOST}
                    DB_PORT=${DB_PORT}
                    DB_NAME=${DB_NAME}
                    DB_USER=${DB_USER}
                    DB_PASSWORD=${DB_PASSWORD}
                    EOF'

                    echo "Reloading PM2"

                    sudo -u mcramtek-admin bash -c '
                    cd /var/www/pramaan-backend &&
                    pm2 reload ecosystem.config.js --env production
      '
                    echo "PM2 reload completed"
                '''
          }
        }
    }
}
