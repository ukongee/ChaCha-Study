package kr.ac.cnu.chachastudy.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AiChatRequest(
        String model,
        List<Message> messages,

        @JsonProperty("max_tokens")
        Integer maxTokens,

        Double temperature
) {
    public record Message(String role, String content) {

        public static Message system(String content) {
            return new Message("system", content);
        }

        public static Message user(String content) {
            return new Message("user", content);
        }
    }
}
