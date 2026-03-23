package kr.ac.cnu.chachastudy.document.service;

import kr.ac.cnu.chachastudy.auth.domain.User;
import kr.ac.cnu.chachastudy.auth.repository.UserRepository;
import kr.ac.cnu.chachastudy.document.domain.Document;
import kr.ac.cnu.chachastudy.document.domain.FileType;
import kr.ac.cnu.chachastudy.document.dto.DocumentResponse;
import kr.ac.cnu.chachastudy.document.repository.DocumentRepository;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final FileParserService fileParserService;

    @Transactional
    public DocumentResponse upload(Long userId, MultipartFile file) {
        validateFile(file);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        FileType fileType = FileType.from(file.getOriginalFilename());
        FileParserService.ParseResult parsed = fileParserService.parse(file, fileType);

        Document document = Document.builder()
                .user(user)
                .originalFileName(file.getOriginalFilename())
                .storedFileName(UUID.randomUUID() + "_" + file.getOriginalFilename())
                .fileType(fileType)
                .extractedText(parsed.text())
                .pageCount(parsed.pageCount())
                .fileSize(file.getSize())
                .build();

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

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }
    }
}
