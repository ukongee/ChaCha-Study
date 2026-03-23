package kr.ac.cnu.chachastudy.review.dto;

import jakarta.validation.constraints.*;
import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.review.domain.Difficulty;
import kr.ac.cnu.chachastudy.review.domain.ExamType;

public record ReviewCreateRequest(

        @NotBlank(message = "과목명은 필수입니다.")
        String courseName,

        @NotBlank(message = "교수명은 필수입니다.")
        String professorName,

        @NotNull(message = "학과를 선택해주세요.")
        Department department,

        @Min(1) @Max(5)
        int rating,

        @NotNull(message = "시험 유형을 선택해주세요.")
        ExamType examType,

        @NotNull(message = "난이도를 선택해주세요.")
        Difficulty difficulty,

        String tip,

        String examInfo
) {}
