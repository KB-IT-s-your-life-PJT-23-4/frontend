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
        REPOSITORY_URL = 'https://github.com/KB-IT-s-your-life-PJT-23-4/frontend.git'
        VITE_API_BASE_URL = '/api'
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

                    echo "Repository: ${REPOSITORY_URL}"
                    echo "Commit: $(git rev-parse HEAD)"
                    echo "Image: ${IMAGE_NAME}:${BUILD_NUMBER}"
                    echo "API base URL: ${VITE_API_BASE_URL}"
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

                        if [ -z "${VITE_KAKAO_JS_KEY}" ]
                        then
                            echo "mirizoom-kakao-js-key Credential 값이 비어 있습니다."
                            exit 1
                        fi

                        docker build \
                            --pull \
                            --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
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
        
        stage('Trigger Deploy') {
            steps {
                build(
                    job: 'mirizoom-deploy',
                    wait: true,
                    propagate: true,
                    parameters: [
                        string(name: 'SERVICE', value: 'frontend'),
                        string(name: 'IMAGE_TAG', value: "${BUILD_NUMBER}")
                    ]
                )
            }
        }
    }

    post {
        success {
            echo "Frontend 이미지 Push 및 배포 완료: ${IMAGE_NAME}:${BUILD_NUMBER}"
        }

        failure {
            echo 'Frontend CI/CD 파이프라인 실행 중 실패했습니다.'
        }

        always {
            sh '''
                docker image rm \
                    "${IMAGE_NAME}:${BUILD_NUMBER}" \
                    "${IMAGE_NAME}:latest" \
                    >/dev/null 2>&1 || true
            '''

            deleteDir()
        }
    }
}
