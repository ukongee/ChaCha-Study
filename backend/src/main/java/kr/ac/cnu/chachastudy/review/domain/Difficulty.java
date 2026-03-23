package kr.ac.cnu.chachastudy.review.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Difficulty {
    VERY_EASY("매우 쉬움"),
    EASY("쉬움"),
    MEDIUM("보통"),
    HARD("어려움"),
    VERY_HARD("매우 어려움");

    private final String label;
}
