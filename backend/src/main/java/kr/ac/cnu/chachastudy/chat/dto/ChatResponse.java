package kr.ac.cnu.chachastudy.chat.dto;

import kr.ac.cnu.chachastudy.chat.domain.ChatMessage;

import java.time.LocalDateTime;

public record ChatResponse(
        Long id,
        String role,
        String content,
        LocalDateTime createdAt
) {
    public static ChatResponse from(ChatMessage message) {
        return new ChatResponse(
                message.getId(),
                message.getRole().name().toLowerCase(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
