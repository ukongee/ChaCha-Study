package kr.ac.cnu.chachastudy.review.service;

import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.auth.domain.User;
import kr.ac.cnu.chachastudy.auth.repository.UserRepository;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import kr.ac.cnu.chachastudy.review.domain.CourseReview;
import kr.ac.cnu.chachastudy.review.dto.ReviewCreateRequest;
import kr.ac.cnu.chachastudy.review.dto.ReviewResponse;
import kr.ac.cnu.chachastudy.review.repository.CourseReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseReviewService {

    private final CourseReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse createReview(Long userId, ReviewCreateRequest request) {
        if (reviewRepository.existsByUserIdAndCourseName(userId, request.courseName())) {
            throw new BusinessException(ErrorCode.DUPLICATE_REVIEW);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        CourseReview review = CourseReview.builder()
                .user(user)
                .courseName(request.courseName())
                .professorName(request.professorName())
                .department(request.department())
                .rating(request.rating())
                .examType(request.examType())
                .difficulty(request.difficulty())
                .tip(request.tip())
                .examInfo(request.examInfo())
                .build();

        return ReviewResponse.from(reviewRepository.save(review));
    }

    public Page<ReviewResponse> getReviews(Department department, String courseName, Pageable pageable) {
        if (courseName != null && !courseName.isBlank()) {
            return reviewRepository
                    .findByCourseNameContainingIgnoreCaseOrderByCreatedAtDesc(courseName, pageable)
                    .map(ReviewResponse::from);
        }
        if (department != null) {
            return reviewRepository.findByDepartmentOrderByCreatedAtDesc(department, pageable)
                    .map(ReviewResponse::from);
        }
        return reviewRepository.findAll(pageable).map(ReviewResponse::from);
    }
}
