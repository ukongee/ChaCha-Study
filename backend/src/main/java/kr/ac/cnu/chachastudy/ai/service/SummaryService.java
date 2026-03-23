package kr.ac.cnu.chachastudy.ai.service;

import kr.ac.cnu.chachastudy.ai.client.AiApiClient;
import kr.ac.cnu.chachastudy.ai.dto.AiChatRequest;
import kr.ac.cnu.chachastudy.ai.dto.AiRequest;
import kr.ac.cnu.chachastudy.ai.dto.SummaryResponse;
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
public class SummaryService {

    private final AiApiClient aiApiClient;
    private final DocumentRepository documentRepository;
    private final AiResponseParser aiResponseParser;

    public SummaryResponse summarize(Long userId, String apiKey, AiRequest request) {
        Document document = getDocument(userId, request.documentId());

        AiChatRequest chatRequest = new AiChatRequest(
                request.model(),
                List.of(
                        AiChatRequest.Message.system(PromptTemplate.SUMMARY_SYSTEM),
                        AiChatRequest.Message.user(PromptTemplate.summaryUser(document.getExtractedText()))
                ),
                2048,
                0.3
        );

        String raw = aiApiClient.chat(apiKey, chatRequest);
        return aiResponseParser.parse(raw, SummaryResponse.class);
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
