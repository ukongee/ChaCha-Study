package kr.ac.cnu.chachastudy.document.domain;

import jakarta.persistence.*;
import kr.ac.cnu.chachastudy.auth.domain.User;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String storedFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FileType fileType;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Column(nullable = false)
    private Integer pageCount;

    @Column(nullable = false)
    private Long fileSize;

    @Column(columnDefinition = "TEXT")
    private String cachedSummaryJson;

    @Column
    private String filePath;

    @Column(columnDefinition = "TEXT")
    private String pageTextsJson;

    @Column(columnDefinition = "TEXT")
    private String translatedPageTextsJson;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public void updateCachedSummary(String summaryJson) {
        this.cachedSummaryJson = summaryJson;
    }

    public void updateFilePath(String filePath) {
        this.filePath = filePath;
    }

    public void updatePageTexts(String pageTextsJson) {
        this.pageTextsJson = pageTextsJson;
    }

    public void updateTranslatedPageTexts(String json) {
        this.translatedPageTextsJson = json;
    }

    @Builder
    public Document(User user, String originalFileName, String storedFileName,
                    FileType fileType, String extractedText, Integer pageCount, Long fileSize) {
        this.user = user;
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.fileType = fileType;
        this.extractedText = extractedText;
        this.pageCount = pageCount;
        this.fileSize = fileSize;
    }
}
