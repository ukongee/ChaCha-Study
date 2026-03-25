package kr.ac.cnu.chachastudy.document.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.ac.cnu.chachastudy.auth.domain.User;
import kr.ac.cnu.chachastudy.auth.repository.UserRepository;
import kr.ac.cnu.chachastudy.document.domain.Document;
import kr.ac.cnu.chachastudy.document.domain.FileType;
import kr.ac.cnu.chachastudy.document.dto.DocumentResponse;
import kr.ac.cnu.chachastudy.document.repository.DocumentRepository;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final FileParserService fileParserService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @Transactional
    public DocumentResponse upload(Long userId, MultipartFile file) {
        validateFile(file);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        FileType fileType = FileType.from(file.getOriginalFilename());
        FileParserService.ParseResult parsed = fileParserService.parse(file, fileType);

        String storedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String filePath = null;
        try {
            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);
            Path dest = uploadPath.resolve(storedFileName);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dest);
            }
            filePath = dest.toString();
        } catch (Exception e) {
            log.warn("Failed to save file to disk: {}", e.getMessage());
        }

        String pageTextsJson = null;
        try {
            pageTextsJson = objectMapper.writeValueAsString(parsed.pageTexts());
        } catch (Exception e) {
            log.warn("Failed to serialize page texts");
        }

        Document document = Document.builder()
                .user(user)
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .fileType(fileType)
                .extractedText(parsed.text())
                .pageCount(parsed.pageCount())
                .fileSize(file.getSize())
                .build();

        if (filePath != null) document.updateFilePath(filePath);
        if (pageTextsJson != null) document.updatePageTexts(pageTextsJson);

        return DocumentResponse.from(documentRepository.save(document));
    }

    public List<DocumentResponse> getMyDocuments(Long userId) {
        return documentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DocumentResponse::from)
                .toList();
    }

    public String getExtractedText(Long userId, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));

        if (!document.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        return document.getExtractedText();
    }

    public ResponseEntity<Resource> getFile(Long userId, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
        if (!document.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (document.getFilePath() == null) {
            throw new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
        try {
            Path filePath = Paths.get(document.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                throw new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND);
            }
            String contentType = document.getFileType() == FileType.PDF
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + document.getOriginalFileName() + "\"")
                    .body(resource);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
    }

    public List<String> getPageTexts(Long userId, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
        if (!document.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (document.getPageTextsJson() == null) return List.of();
        try {
            return objectMapper.readValue(document.getPageTextsJson(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return List.of();
        }
    }

    @Transactional
    public void deleteDocument(Long userId, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
        if (!document.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (document.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(document.getFilePath()));
            } catch (IOException e) {
                log.warn("Failed to delete file: {}", document.getFilePath());
            }
        }
        documentRepository.delete(document);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }
    }
}
