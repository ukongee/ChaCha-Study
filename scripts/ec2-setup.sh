#!/bin/bash
# EC2 초기 세팅 스크립트 (Ubuntu 22.04 기준)
set -e

echo "=== Docker 설치 ==="
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(. /etc/os-release && echo "\$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker \$USER

echo "=== 프로젝트 디렉토리 생성 ==="
mkdir -p ~/chachastudy/nginx/ssl
cd ~/chachastudy

echo ""
echo "✅ Docker 설치 완료!"
echo ""
echo "다음 단계:"
echo "1. 이 repo를 clone: git clone https://github.com/ukongee/ChaCha-Study.git ~/chachastudy"
echo "2. .env 파일 설정: cp .env.example .env && nano .env"
echo "3. GitHub Secrets 설정: EC2_HOST, EC2_USER, EC2_SSH_KEY"
echo "4. main 브랜치에 push하면 자동 배포됩니다"
