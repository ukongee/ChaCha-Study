package kr.ac.cnu.chachastudy.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "잘못된 입력입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // Auth
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 사용자입니다."),

    // Document
    DOCUMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "자료를 찾을 수 없습니다."),
    UNSUPPORTED_FILE_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 파일 형식입니다. (PDF, PPT, PPTX만 가능)"),
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "파일 크기는 50MB를 초과할 수 없습니다."),
    FILE_PARSE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 파싱에 실패했습니다."),

    // AI
    AI_API_FAILED(HttpStatus.BAD_GATEWAY, "AI API 호출에 실패했습니다."),
    AI_API_KEY_MISSING(HttpStatus.BAD_REQUEST, "API 키가 필요합니다."),

    // Community
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),
    ALREADY_LIKED(HttpStatus.CONFLICT, "이미 좋아요를 눌렀습니다."),

    // Review
    DUPLICATE_REVIEW(HttpStatus.CONFLICT, "이미 해당 과목의 후기를 작성했습니다.");

    private final HttpStatus status;
    private final String message;
}
