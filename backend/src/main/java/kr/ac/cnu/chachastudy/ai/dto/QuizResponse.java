package kr.ac.cnu.chachastudy.ai.dto;

import java.util.List;

public record QuizResponse(List<QuizItem> quizzes) {

    public record QuizItem(
            String type,
            String question,
            List<String> options,
            String answer,
            String explanation
    ) {}
}
