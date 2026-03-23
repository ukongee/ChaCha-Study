#!/bin/bash
# EC2 최초 세팅 스크립트 (Ubuntu 22.04 기준)
# 실행: bash ec2-setup.sh

set -e

echo "=== Docker 설치 ==="
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER

echo "=== 프로젝트 디렉토리 생성 ==="
mkdir -p ~/chachastudy/nginx

echo "=== .env 파일 생성 (값을 직접 입력해주세요) ==="
cat > ~/chachastudy/.env << 'EOF'
DB_USERNAME=chachastudy
DB_PASSWORD=your_strong_password_here
JWT_SECRET=your_jwt_secret_key_must_be_at_least_256_bits
GITHUB_REPOSITORY=ukongee/ChaCha-Study
EOF

echo ""
echo "=== 완료! ==="
echo "다음 단계:"
echo "1. ~/chachastudy/.env 파일에서 비밀번호 변경"
echo "2. ~/chachastudy/nginx/nginx.conf 복사"
echo "3. ~/chachastudy/docker-compose.prod.yml 복사"
echo "4. docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "GitHub Secrets 설정 필요:"
echo "  EC2_HOST     : EC2 퍼블릭 IP"
echo "  EC2_USER     : ubuntu"
echo "  EC2_SSH_KEY  : EC2 .pem 파일 내용"
