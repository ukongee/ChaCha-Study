/**
 * 게이트웨이 모델 ID 중앙 관리
 *
 * CNU AI 게이트웨이는 제공 모델 목록이 바뀔 수 있고, 존재하지 않는 모델을 요청하면
 * **본문 없는 404**를 돌려준다(OpenAI SDK 메시지: "404 status code (no body)").
 * 모델 ID가 라우트마다 하드코딩돼 있으면 이 상황에서 전 기능이 동시에 죽는다.
 *
 * 그래서:
 *   1. 모델 ID를 이 파일 한 곳에 모으고
 *   2. 환경변수로 재배포 없이 교체할 수 있게 하고
 *   3. 404가 나면 FALLBACK_MODELS 순서대로 재시도한다 (createCompletion 참고)
 *
 * 키로 실제 사용 가능한 목록은 `GET /api/ai/models` (설정 페이지 버튼)로 확인한다.
 */

/** 긴 해설·추론이 필요한 작업: 요약, 퀴즈, 마인드맵, 위키, 개념, 시험포인트, 채팅 */
export const SMART_MODEL = process.env.AI_SMART_MODEL ?? "claude-sonnet-4-6";

/** 짧고 빠른 생성 작업: 플래시카드, 암기 */
export const FAST_MODEL = process.env.AI_FAST_MODEL ?? "claude-haiku-4-5-20251001";

/** 이미지 입력(Vision)이 필요한 작업: 이미지 기반 PDF 요약 */
export const VISION_MODEL = process.env.AI_VISION_MODEL ?? SMART_MODEL;

/**
 * 요청한 모델이 404(게이트웨이에 없음)일 때 순서대로 시도할 대체 모델.
 * 앞쪽일수록 우선. AI_FALLBACK_MODELS 로 덮어쓸 수 있다 (쉼표 구분).
 */
export const FALLBACK_MODELS: string[] = (
  process.env.AI_FALLBACK_MODELS ??
  "claude-sonnet-4-6,claude-haiku-4-5,claude-haiku-4-5-20251001,gpt-5.3,gpt-5.4-mini,gpt-4o-mini"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
