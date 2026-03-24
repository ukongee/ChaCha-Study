package kr.ac.cnu.chachastudy.document.controller;

import kr.ac.cnu.chachastudy.document.dto.DocumentResponse;
import kr.ac.cnu.chachastudy.document.service.DocumentService;
import kr.ac.cnu.chachastudy.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> upload(
            @AuthenticationPrincipal Long userId,
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("파일 업로드가 완료되었습니다.", documentService.upload(userId, file)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getMyDocuments(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getMyDocuments(userId)));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getFile(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        return documentService.getFile(userId, id);
    }
}
