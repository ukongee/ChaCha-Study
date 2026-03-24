package kr.ac.cnu.chachastudy.ai.controller;

import jakarta.validation.Valid;
import kr.ac.cnu.chachastudy.ai.dto.*;
import kr.ac.cnu.chachastudy.ai.service.FlashcardService;
import kr.ac.cnu.chachastudy.ai.service.QuizService;
import kr.ac.cnu.chachastudy.ai.service.SummaryService;
import kr.ac.cnu.chachastudy.ai.service.TranslationService;
import kr.ac.cnu.chachastudy.chat.dto.ChatRequest;
import kr.ac.cnu.chachastudy.chat.dto.ChatResponse;
import kr.ac.cnu.chachastudy.chat.service.ChatService;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import kr.ac.cnu.chachastudy.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/{documentId}")
@RequiredArgsConstructor
public class AiController {

    private static final String API_KEY_HEADER = "X-AI-Api-Key";

    private final SummaryService summaryService;
    private final QuizService quizService;
    private final FlashcardService flashcardService;
    private final ChatService chatService;
    private final TranslationService translationService;

    // ─── Summary ────────────────────────────────────────────────────
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<SummaryResponse>> getSummary(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long documentId
    ) {
        SummaryResponse summary = summaryService.getSummary(userId, documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<SummaryResponse>> generateSummary(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(API_KEY_HEADER) String apiKey,
            @PathVariable Long documentId,
            @Valid @RequestBody AiRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(summaryService.summarize(userId, apiKey, documentId, request)));
    }

    // ─── Quiz ────────────────────────────────────────────────────────
    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> generateQuiz(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(API_KEY_HEADER) String apiKey,
            @PathVariable Long documentId,
            @Valid @RequestBody AiRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(quizService.generateQuiz(userId, apiKey, documentId, request)));
    }

    // ─── Flashcard ───────────────────────────────────────────────────
    @PostMapping("/flashcard")
    public ResponseEntity<ApiResponse<FlashcardResponse>> generateFlashcard(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(API_KEY_HEADER) String apiKey,
            @PathVariable Long documentId,
            @Valid @RequestBody AiRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(flashcardService.generateFlashcards(userId, apiKey, documentId, request)));
    }

    // ─── Chat ────────────────────────────────────────────────────────
    @GetMapping("/chat")
    public ResponseEntity<ApiResponse<List<ChatResponse>>> getChatHistory(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long documentId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getHistory(userId, documentId)));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(API_KEY_HEADER) String apiKey,
            @PathVariable Long documentId,
            @Valid @RequestBody ChatRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.chat(userId, apiKey, documentId, request)));
    }

    // ─── Translation ─────────────────────────────────────────────────
    @GetMapping("/translation")
    public ResponseEntity<ApiResponse<TranslationResponse>> getTranslation(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long documentId
    ) {
        return translationService.getTranslation(userId, documentId)
                .map(t -> ResponseEntity.ok(ApiResponse.ok(t)))
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/translation")
    public ResponseEntity<ApiResponse<TranslationResponse>> translate(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(value = API_KEY_HEADER, required = false) String apiKey,
            @PathVariable Long documentId,
            @Valid @RequestBody AiRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                translationService.translate(userId, apiKey, documentId, request)));
    }
}
