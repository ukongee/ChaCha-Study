package kr.ac.cnu.chachastudy.chat.service;

import kr.ac.cnu.chachastudy.ai.client.AiApiClient;
import kr.ac.cnu.chachastudy.ai.dto.AiChatRequest;
import kr.ac.cnu.chachastudy.chat.domain.ChatMessage;
import kr.ac.cnu.chachastudy.chat.domain.MessageRole;
import kr.ac.cnu.chachastudy.chat.dto.ChatRequest;
import kr.ac.cnu.chachastudy.chat.dto.ChatResponse;
import kr.ac.cnu.chachastudy.chat.repository.ChatMessageRepository;
import kr.ac.cnu.chachastudy.document.domain.Document;
import kr.ac.cnu.chachastudy.document.repository.DocumentRepository;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private static final int MAX_HISTORY = 10; // 최근 10개 메시지만 컨텍스트로 사용
    private static final String SYSTEM_PROMPT_TEMPLATE = """
            당신은 강의자료 기반 학습 도우미입니다.
            반드시 아래 강의자료 내용만을 바탕으로 답변하세요.
            강의자료에 없는 내용은 "이 자료에는 해당 내용이 없어요." 라고 답변하세요.

            [강의자료]
            %s
            """;

    private final AiApiClient aiApiClient;
    private final ChatMessageRepository chatMessageRepository;
    private final DocumentRepository documentRepository;

    @Transactional
    public ChatResponse chat(Long userId, String apiKey, Long documentId, ChatRequest request) {
        Document document = getDocument(userId, documentId);

        // 이전 대화 내역 조회 (최근 N개)
        List<ChatMessage> history = chatMessageRepository
                .findByDocumentIdOrderByCreatedAtAsc(document.getId());
        List<ChatMessage> recentHistory = history.size() > MAX_HISTORY
                ? history.subList(history.size() - MAX_HISTORY, history.size())
                : history;

        // AI 요청 메시지 구성
        List<AiChatRequest.Message> messages = new ArrayList<>();
        messages.add(AiChatRequest.Message.system(
                String.format(SYSTEM_PROMPT_TEMPLATE, truncate(document.getExtractedText(), 5000))
        ));

        // 이전 대화 추가
        recentHistory.forEach(msg -> messages.add(
                new AiChatRequest.Message(msg.getRole().name().toLowerCase(), msg.getContent())
        ));

        // 현재 질문 추가
        messages.add(AiChatRequest.Message.user(request.question()));

        String answer = aiApiClient.chat(apiKey, new AiChatRequest(request.model(), messages, 1024, 0.7));

        // 대화 저장
        chatMessageRepository.save(ChatMessage.builder()
                .document(document)
                .role(MessageRole.USER)
                .content(request.question())
                .build());

        ChatMessage assistantMessage = chatMessageRepository.save(ChatMessage.builder()
                .document(document)
                .role(MessageRole.ASSISTANT)
                .content(answer)
                .build());

        return ChatResponse.from(assistantMessage);
    }

    public List<ChatResponse> getHistory(Long userId, Long documentId) {
        getDocument(userId, documentId);
        return chatMessageRepository.findByDocumentIdOrderByCreatedAtAsc(documentId)
                .stream()
                .map(ChatResponse::from)
                .toList();
    }

    @Transactional
    public void clearHistory(Long userId, Long documentId) {
        getDocument(userId, documentId);
        chatMessageRepository.deleteByDocumentId(documentId);
    }

    private Document getDocument(Long userId, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
        if (!document.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return document;
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
}
