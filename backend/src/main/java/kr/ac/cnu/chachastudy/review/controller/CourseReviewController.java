package kr.ac.cnu.chachastudy.review.controller;

import jakarta.validation.Valid;
import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.global.response.ApiResponse;
import kr.ac.cnu.chachastudy.review.dto.ReviewCreateRequest;
import kr.ac.cnu.chachastudy.review.dto.ReviewResponse;
import kr.ac.cnu.chachastudy.review.service.CourseReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class CourseReviewController {

    private final CourseReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReviewCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("후기가 등록되었습니다.", reviewService.createReview(userId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviews(
            @RequestParam(required = false) Department department,
            @RequestParam(required = false) String courseName,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getReviews(department, courseName, pageable)));
    }
}
