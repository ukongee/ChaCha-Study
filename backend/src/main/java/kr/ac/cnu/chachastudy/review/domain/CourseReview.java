package kr.ac.cnu.chachastudy.review.domain;

import jakarta.persistence.*;
import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.auth.domain.User;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_reviews",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_name"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class CourseReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String courseName;

    @Column(nullable = false)
    private String professorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Department department;

    @Column(nullable = false)
    private int rating; // 1~5

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamType examType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(columnDefinition = "TEXT")
    private String tip;

    @Column(columnDefinition = "TEXT")
    private String examInfo;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public CourseReview(User user, String courseName, String professorName, Department department,
                        int rating, ExamType examType, Difficulty difficulty, String tip, String examInfo) {
        this.user = user;
        this.courseName = courseName;
        this.professorName = professorName;
        this.department = department;
        this.rating = rating;
        this.examType = examType;
        this.difficulty = difficulty;
        this.tip = tip;
        this.examInfo = examInfo;
    }
}
