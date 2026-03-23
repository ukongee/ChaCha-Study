# 차차스터디 (ChaCha Study)

> 충남대 학생들을 위한 AI 기반 학습 도우미

PPT/PDF 강의자료를 업로드하면 AI가 자동으로 요약, 퀴즈, 플래시카드를 생성해줍니다.
학생 본인의 충남대 AI API 키를 사용하므로 별도 구독 없이 무료로 사용할 수 있습니다.

## 기술 스택

- **Backend**: Java 21, Spring Boot 3, Spring Security, JPA
- **Frontend**: Next.js 14, Tailwind CSS, PWA
- **DB**: PostgreSQL, Redis
- **AI**: 충남대 AI API (OpenAI 호환)
- **배포**: Docker, AWS EC2

## 로컬 실행

### 사전 준비
- Java 21
- Docker & Docker Compose

### 실행
```bash
docker-compose up -d        # DB 실행
cd backend && ./gradlew bootRun  # 백엔드 실행
cd frontend && npm run dev       # 프론트엔드 실행
```

## 환경 변수

`backend/src/main/resources/application-secret.yml` 파일을 생성하고 아래 값을 설정하세요.

```yaml
DB_USERNAME: your_db_username
DB_PASSWORD: your_db_password
JWT_SECRET: your_jwt_secret_key
```
