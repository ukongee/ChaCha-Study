package kr.ac.cnu.chachastudy.chat.controller;

import jakarta.validation.Valid;
import kr.ac.cnu.chachastudy.chat.dto.ChatRequest;
import kr.ac.cnu.chachastudy.chat.dto.ChatResponse;
import kr.ac.cnu.chachastudy.chat.service.ChatService;
import kr.ac.cnu.chachastudy.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private static final String API_KEY_HEADER = "X-AI-Api-Key";

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(API_KEY_HEADER) String apiKey,
            @Valid @RequestBody ChatRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.chat(userId, apiKey, request)));
    }

    @GetMapping("/{documentId}/history")
    public ResponseEntity<ApiResponse<List<ChatResponse>>> getHistory(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long documentId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getHistory(userId, documentId)));
    }

    @DeleteMapping("/{documentId}/history")
    public ResponseEntity<ApiResponse<Void>> clearHistory(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long documentId
    ) {
        chatService.clearHistory(userId, documentId);
        return ResponseEntity.ok(ApiResponse.ok("대화 내역이 삭제되었습니다."));
    }
}
