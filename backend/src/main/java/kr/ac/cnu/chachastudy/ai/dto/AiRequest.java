package kr.ac.cnu.chachastudy.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record AiRequest(

        @NotBlank(message = "모델명은 필수입니다.")
        String model,

        // 퀴즈/플래시카드 개수
        @Min(value = 1) @Max(value = 20)
        Integer count,

        String difficulty  // EASY, MEDIUM, HARD
) {
    public int countOrDefault() {
        return count != null ? count : 10;
    }

    public String difficultyOrDefault() {
        return difficulty != null ? difficulty : "MEDIUM";
    }
}
