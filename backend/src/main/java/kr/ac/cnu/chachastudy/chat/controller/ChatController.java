package kr.ac.cnu.chachastudy.chat.controller;

import kr.ac.cnu.chachastudy.chat.service.ChatService;
import kr.ac.cnu.chachastudy.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @DeleteMapping("/{documentId}/history")
    public ResponseEntity<ApiResponse<Void>> clearHistory(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long documentId
    ) {
        chatService.clearHistory(userId, documentId);
        return ResponseEntity.ok(ApiResponse.ok("대화 내역이 삭제되었습니다."));
    }
}
