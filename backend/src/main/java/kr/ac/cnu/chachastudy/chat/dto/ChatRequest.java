package kr.ac.cnu.chachastudy.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(

        @NotBlank(message = "모델명은 필수입니다.")
        String model,

        @NotBlank(message = "질문을 입력해주세요.")
        String question
) {}
