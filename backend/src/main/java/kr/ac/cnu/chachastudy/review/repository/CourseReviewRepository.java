package kr.ac.cnu.chachastudy.review.repository;

import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.review.domain.CourseReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CourseReviewRepository extends JpaRepository<CourseReview, Long> {

    Page<CourseReview> findByDepartmentOrderByCreatedAtDesc(Department department, Pageable pageable);

    Page<CourseReview> findByCourseNameContainingIgnoreCaseOrderByCreatedAtDesc(String courseName, Pageable pageable);

    @Query("SELECT r.courseName, AVG(r.rating), COUNT(r) FROM CourseReview r GROUP BY r.courseName ORDER BY AVG(r.rating) DESC")
    List<Object[]> findCourseRatingStats();

    boolean existsByUserIdAndCourseName(Long userId, String courseName);
}
