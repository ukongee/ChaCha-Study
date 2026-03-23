package kr.ac.cnu.chachastudy.ai.controller;

import jakarta.validation.Valid;
import kr.ac.cnu.chachastudy.ai.dto.*;
import kr.ac.cnu.chachastudy.ai.service.FlashcardService;
import kr.ac.cnu.chachastudy.ai.service.QuizService;
import kr.ac.cnu.chachastudy.ai.service.SummaryService;
import kr.ac.cnu.chachastudy.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private static final String API_KEY_HEADER = "X-AI-Api-Key";

    private final SummaryService summaryService;
    private final QuizService quizService;
    private final FlashcardService flashcardService;

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<SummaryResponse>> summarize(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(API_KEY_HEADER) String apiKey,
            @Valid @RequestBody AiRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(summaryService.summarize(userId, apiKey, request)));
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> generateQuiz(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(API_KEY_HEADER) String apiKey,
            @Valid @RequestBody AiRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(quizService.generateQuiz(userId, apiKey, request)));
    }

    @PostMapping("/flashcard")
    public ResponseEntity<ApiResponse<FlashcardResponse>> generateFlashcards(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(API_KEY_HEADER) String apiKey,
            @Valid @RequestBody AiRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(flashcardService.generateFlashcards(userId, apiKey, request)));
    }
}
