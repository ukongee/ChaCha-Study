package kr.ac.cnu.chachastudy.review.dto;

import kr.ac.cnu.chachastudy.review.domain.CourseReview;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        String courseName,
        String professorName,
        String department,
        int rating,
        String examType,
        String difficulty,
        String tip,
        String examInfo,
        String author,
        LocalDateTime createdAt
) {
    public static ReviewResponse from(CourseReview review) {
        return new ReviewResponse(
                review.getId(),
                review.getCourseName(),
                review.getProfessorName(),
                review.getDepartment().getLabel(),
                review.getRating(),
                review.getExamType().getLabel(),
                review.getDifficulty().getLabel(),
                review.getTip(),
                review.getExamInfo(),
                review.getUser().getNickname(),
                review.getCreatedAt()
        );
    }
}
