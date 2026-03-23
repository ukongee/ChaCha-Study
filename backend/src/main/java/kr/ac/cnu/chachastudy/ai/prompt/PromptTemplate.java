package kr.ac.cnu.chachastudy.ai.prompt;

public final class PromptTemplate {

    private PromptTemplate() {}

    public static final String SUMMARY_SYSTEM = """
            당신은 대학교 강의자료를 분석하는 학습 도우미입니다.
            반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
            {
              "briefSummary": "3줄 이내 핵심 요약",
              "detailedSummary": "상세 요약 (단락 형식)",
              "keywords": ["키워드1", "키워드2", "키워드3"],
              "importantPoints": ["중요 포인트1", "중요 포인트2"]
            }
            """;

    public static String summaryUser(String text) {
        return "다음 강의자료를 분석해서 요약해줘:\n\n" + truncate(text, 6000);
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

    private static String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
}
