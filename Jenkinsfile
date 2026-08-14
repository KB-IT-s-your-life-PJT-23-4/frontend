pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    environment {
        IMAGE_NAME = 'wosyh18/mirizoom-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate') {
            steps {
                sh '''
                    set -eu

                    docker --version
                    test -f Dockerfile
                    test -f nginx.conf
                    test -f package.json
                    test -f package-lock.json

                    echo "Repository: ${GIT_URL}"
                    echo "Commit: ${GIT_COMMIT}"
                    echo "Image: ${IMAGE_NAME}:${BUILD_NUMBER}"
                '''
            }
        }

        // 현재 package.json의 npm test는 실제 테스트가 아닙니다.
        // Vitest 설정 후 Docker 이미지 빌드 전에 Test stage를 추가해야 합니다.
        stage('Build Image') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'mirizoom-kakao-js-key',
                        variable: 'VITE_KAKAO_JS_KEY'
                    )
                ]) {
                    sh '''
                        set -eu

                        docker build \
                            --pull \
                            --build-arg VITE_API_BASE_URL=/api \
                            --build-arg VITE_KAKAO_JS_KEY="${VITE_KAKAO_JS_KEY}" \
                            --tag "${IMAGE_NAME}:${BUILD_NUMBER}" \
                            --tag "${IMAGE_NAME}:latest" \
                            .
                    '''
                }
            }
        }

        stage('Push Image to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu

                        export DOCKER_CONFIG="${WORKSPACE}/.docker"
                        mkdir -p "${DOCKER_CONFIG}"

                        echo "${DOCKERHUB_TOKEN}" |
                            docker login \
                                --username "${DOCKERHUB_USERNAME}" \
                                --password-stdin

                        docker push "${IMAGE_NAME}:${BUILD_NUMBER}"
                        docker push "${IMAGE_NAME}:latest"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Frontend 이미지 Push 완료: ${IMAGE_NAME}:${BUILD_NUMBER}"
        }

        failure {
            echo 'Frontend 이미지 Build 또는 Push에 실패했습니다.'
        }

        always {
            deleteDir()
        }
    }
}