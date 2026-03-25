package kr.ac.cnu.chachastudy.ai.service;

import kr.ac.cnu.chachastudy.ai.client.AiApiClient;
import kr.ac.cnu.chachastudy.ai.dto.AiChatRequest;
import kr.ac.cnu.chachastudy.ai.dto.AiRequest;
import kr.ac.cnu.chachastudy.ai.dto.QuizResponse;
import kr.ac.cnu.chachastudy.ai.prompt.PromptTemplate;
import kr.ac.cnu.chachastudy.document.domain.Document;
import kr.ac.cnu.chachastudy.document.repository.DocumentRepository;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final AiApiClient aiApiClient;
    private final DocumentRepository documentRepository;
    private final AiResponseParser aiResponseParser;

    public QuizResponse generateQuiz(Long userId, String apiKey, Long documentId, AiRequest request) {
        Document document = getDocument(userId, documentId);

        AiChatRequest chatRequest = new AiChatRequest(
                request.model(),
                List.of(
                        AiChatRequest.Message.system(PromptTemplate.QUIZ_SYSTEM),
                        AiChatRequest.Message.user(PromptTemplate.quizUser(
                                document.getExtractedText(),
                                request.countOrDefault(),
                                request.difficultyOrDefault()
                        ))
                ),
                4096,
                0.5
        );

        String raw = aiApiClient.chat(apiKey, chatRequest);
        return aiResponseParser.parse(raw, QuizResponse.class);
    }

    private Document getDocument(Long userId, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
        if (!document.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return document;
    }
}
