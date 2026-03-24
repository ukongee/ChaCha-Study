package kr.ac.cnu.chachastudy.ai.prompt;

import java.util.List;

public final class PromptTemplate {

    private PromptTemplate() {}

    public static final String SUMMARY_SYSTEM = """
            당신은 대학교 강의자료를 분석하는 전문 학습 도우미입니다.
            반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
            {
              "briefSummary": "전체 강의의 핵심을 3줄 이내로 요약",
              "detailedSummary": "강의 전체 내용을 섹션별로 상세하게 설명 (마크다운 없이 자연스러운 문단으로)",
              "keywords": [
                {"text": "핵심 용어나 개념", "page": 해당_페이지_번호}
              ],
              "importantPoints": ["시험에 나올 만한 핵심 포인트1", "핵심 포인트2"],
              "pageSummaries": [
                {"page": 페이지번호, "title": "페이지 제목 또는 주제", "summary": "해당 페이지의 핵심 내용 2-3줄"}
              ]
            }
            keywords의 page는 1부터 시작하는 정수여야 합니다.
            pageSummaries는 각 페이지/슬라이드별로 생성하되, 내용이 없는 페이지는 제외하세요.
            """;

    public static String summaryUser(String text, List<String> pageTexts) {
        StringBuilder sb = new StringBuilder();
        sb.append("아래 강의자료를 페이지별로 분석하여 JSON 형식으로 요약해줘.\n\n");

        if (pageTexts != null && !pageTexts.isEmpty()) {
            int limit = Math.min(pageTexts.size(), 30); // max 30 pages
            for (int i = 0; i < limit; i++) {
                String pageText = pageTexts.get(i);
                if (pageText != null && !pageText.isBlank()) {
                    sb.append("=== ").append(i + 1).append("페이지 ===\n");
                    sb.append(truncate(pageText, 300)).append("\n\n");
                }
                if (sb.length() > 7000) break;
            }
        } else {
            sb.append(truncate(text, 6000));
        }

        return sb.toString();
    }

    public static String summaryUser(String text) {
        return summaryUser(text, null);
    }

    public static final String QUIZ_SYSTEM = """
            당신은 대학교 시험 문제를 출제하는 전문가입니다.
            반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
            {
              "quizzes": [
                {
                  "type": "MULTIPLE_CHOICE",
                  "question": "문제",
                  "options": ["①번", "②번", "③번", "④번"],
                  "answer": "①번",
                  "explanation": "해설"
                }
              ]
            }
            """;

    public static String quizUser(String text, int count, String difficulty) {
        String difficultyDesc = switch (difficulty) {
            case "EASY" -> "기본 개념을 확인하는 쉬운";
            case "HARD" -> "심화 이해와 응용이 필요한 어려운";
            default -> "적절한 난이도의";
        };
        return String.format(
                "다음 강의자료를 바탕으로 %s 문제 %d개를 출제해줘:\n\n%s",
                difficultyDesc, count, truncate(text, 6000)
        );
    }

    public static final String FLASHCARD_SYSTEM = """
            당신은 핵심 개념을 암기카드로 만드는 학습 도우미입니다.
            반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
            {
              "flashcards": [
                {
                  "front": "개념 또는 용어",
                  "back": "설명 또는 정의"
                }
              ]
            }
            """;

    public static String flashcardUser(String text) {
        return "다음 강의자료에서 핵심 개념 암기카드를 만들어줘:\n\n" + truncate(text, 6000);
    }

    public static final String TRANSLATION_SYSTEM = """
            당신은 영어 강의자료를 한국어로 번역하는 전문 번역가입니다.
            반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
            {
              "pages": [
                {"page": 1, "text": "번역된 한국어 텍스트"}
              ]
            }
            번역 시 전문 용어는 영어(한국어) 형식으로 표기하세요. (예: Database(데이터베이스))
            자연스러운 한국어로 번역하되 학술적 맥락을 유지하세요.
            """;

    public static String translationUser(List<String> pageTexts) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음 영어 강의자료를 페이지별로 한국어로 번역해줘:\n\n");
        int limit = Math.min(pageTexts.size(), 20);
        for (int i = 0; i < limit; i++) {
            String text = pageTexts.get(i);
            if (text != null && !text.isBlank()) {
                sb.append("=== Page ").append(i + 1).append(" ===\n");
                sb.append(truncate(text, 400)).append("\n\n");
            }
            if (sb.length() > 7000) break;
        }
        return sb.toString();
    }

    private static String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
}
