package kr.ac.cnu.chachastudy.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.ac.cnu.chachastudy.auth.domain.Department;

public record PostCreateRequest(

        @NotBlank(message = "제목은 필수입니다.")
        String title,

        @NotBlank(message = "내용은 필수입니다.")
        String content,

        @NotBlank(message = "과목명은 필수입니다.")
        String courseName,

        @NotNull(message = "학과를 선택해주세요.")
        Department department,

        boolean anonymous
) {}
