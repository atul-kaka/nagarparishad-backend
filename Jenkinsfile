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

                    # Create .env.production with proper variable substitution
                    sudo -u mcramtek-admin bash -c "
                    cat > /var/www/pramaan-backend/.env.production <<'ENVEOF'
NODE_ENV=production
PORT=3000
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
ENABLE_ENCRYPTION=${ENABLE_ENCRYPTION}
ENVEOF
                    "

                    # Also create .env file (dotenv reads .env by default)
                    sudo -u mcramtek-admin bash -c "
                    cp /var/www/pramaan-backend/.env.production /var/www/pramaan-backend/.env
                    "

                    echo ".env.production and .env created"
                    
                    # Verify password is set (without showing it)
                    sudo -u mcramtek-admin bash -c "
                    if grep -q 'DB_PASSWORD=' /var/www/pramaan-backend/.env.production; then
                        if grep 'DB_PASSWORD=$' /var/www/pramaan-backend/.env.production > /dev/null; then
                            echo 'ERROR: DB_PASSWORD is empty!'
                            exit 1
                        else
                            echo 'DB_PASSWORD is set (hidden for security)'
                        fi
                    else
                        echo 'ERROR: DB_PASSWORD not found in .env.production!'
                        exit 1
                    fi
                    "

                    # Install production dependencies
                    sudo -u mcramtek-admin bash -c "
                    cd /var/www/pramaan-backend &&
                    npm install --production
                    "

                    # Restart PM2 (delete first if exists, then start fresh)
                    sudo -u mcramtek-admin bash -c "
                    cd /var/www/pramaan-backend &&
                    pm2 delete nagarparishad-api || true &&
                    pm2 start ecosystem.config.js --env production &&
                    pm2 save
                    "
                    
                    # Wait for server to start
                    sleep 5
                    
                    # Verify server is running
                    pm2 status nagarparishad-api || {
                        echo "ERROR: PM2 failed to start the application"
                        pm2 logs nagarparishad-api --lines 50
                        exit 1
                    }
                    
                    echo "PM2 started successfully"
                '''
          }
        }
    }
}
