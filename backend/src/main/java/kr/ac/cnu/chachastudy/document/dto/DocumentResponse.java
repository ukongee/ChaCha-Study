package kr.ac.cnu.chachastudy.document.dto;

import kr.ac.cnu.chachastudy.document.domain.Document;

import java.time.LocalDateTime;

public record DocumentResponse(
        Long id,
        String originalFileName,
        String fileType,
        Integer pageCount,
        Long fileSize,
        LocalDateTime createdAt
) {
    public static DocumentResponse from(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getOriginalFileName(),
                document.getFileType().name(),
                document.getPageCount(),
                document.getFileSize(),
                document.getCreatedAt()
        );
    }
}
