package kr.ac.cnu.chachastudy.ai.dto;

import java.util.List;

public record AiChatResponse(
        List<Choice> choices
) {
    public record Choice(Message message) {}

    public record Message(String role, String content) {}

    public String getContent() {
        if (choices == null || choices.isEmpty()) return "";
        return choices.get(0).message().content();
    }
}
