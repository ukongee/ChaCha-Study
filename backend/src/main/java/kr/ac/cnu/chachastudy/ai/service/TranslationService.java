package kr.ac.cnu.chachastudy.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.ac.cnu.chachastudy.ai.client.AiApiClient;
import kr.ac.cnu.chachastudy.ai.dto.AiChatRequest;
import kr.ac.cnu.chachastudy.ai.dto.AiRequest;
import kr.ac.cnu.chachastudy.ai.dto.TranslationResponse;
import kr.ac.cnu.chachastudy.ai.prompt.PromptTemplate;
import kr.ac.cnu.chachastudy.document.domain.Document;
import kr.ac.cnu.chachastudy.document.repository.DocumentRepository;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TranslationService {

    private final AiApiClient aiApiClient;
    private final DocumentRepository documentRepository;
    private final AiResponseParser aiResponseParser;
    private final ObjectMapper objectMapper;

    public Optional<TranslationResponse> getTranslation(Long userId, Long documentId) {
        Document document = getDocument(userId, documentId);
        if (document.getTranslatedPageTextsJson() == null) return Optional.empty();
        try {
            return Optional.of(objectMapper.readValue(
                    document.getTranslatedPageTextsJson(), TranslationResponse.class));
        } catch (Exception e) {
            log.warn("Failed to parse cached translation for document {}", documentId);
            return Optional.empty();
        }
    }

    @Transactional
    public TranslationResponse translate(Long userId, String apiKey, Long documentId, AiRequest request) {
        Document document = getDocument(userId, documentId);

        List<String> pageTexts = List.of();
        if (document.getPageTextsJson() != null) {
            try {
                pageTexts = objectMapper.readValue(document.getPageTextsJson(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (Exception e) {
                log.warn("Failed to parse page texts for document {}", documentId);
            }
        }

        AiChatRequest chatRequest = new AiChatRequest(
                request.model(),
                List.of(
                        AiChatRequest.Message.system(PromptTemplate.TRANSLATION_SYSTEM),
                        AiChatRequest.Message.user(PromptTemplate.translationUser(pageTexts))
                ),
                4096,
                0.3
        );

        String raw = aiApiClient.chat(apiKey, chatRequest);
        TranslationResponse response = aiResponseParser.parse(raw, TranslationResponse.class);

        try {
            document.updateTranslatedPageTexts(objectMapper.writeValueAsString(response));
        } catch (Exception e) {
            log.warn("Failed to cache translation for document {}", documentId);
        }

        return response;
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
