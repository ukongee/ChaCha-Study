package kr.ac.cnu.chachastudy.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AiRequest(

        @NotNull(message = "문서 ID는 필수입니다.")
        Long documentId,

        @NotBlank(message = "모델명은 필수입니다.")
        String model,

        // 퀴즈 전용
        @Min(value = 1) @Max(value = 20)
        Integer quizCount,

        String difficulty  // EASY, MEDIUM, HARD
) {
    public int quizCountOrDefault() {
        return quizCount != null ? quizCount : 10;
    }

    public String difficultyOrDefault() {
        return difficulty != null ? difficulty : "MEDIUM";
    }
}
