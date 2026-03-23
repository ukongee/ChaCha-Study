package kr.ac.cnu.chachastudy.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChatRequest(

        @NotNull(message = "문서 ID는 필수입니다.")
        Long documentId,

        @NotBlank(message = "모델명은 필수입니다.")
        String model,

        @NotBlank(message = "질문을 입력해주세요.")
        String message
) {}
