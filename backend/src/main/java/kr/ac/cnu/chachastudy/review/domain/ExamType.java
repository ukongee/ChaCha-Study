package kr.ac.cnu.chachastudy.review.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ExamType {
    MULTIPLE_CHOICE("객관식"),
    SHORT_ANSWER("단답형"),
    ESSAY("서술형"),
    MIXED("복합형"),
    ASSIGNMENT("과제형"),
    NO_EXAM("시험없음");

    private final String label;
}
