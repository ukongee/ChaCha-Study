package kr.ac.cnu.chachastudy.ai.dto;

import java.util.List;

public record FlashcardResponse(List<FlashcardItem> flashcards) {

    public record FlashcardItem(
            String front,
            String back
    ) {}
}
