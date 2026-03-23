package kr.ac.cnu.chachastudy.auth.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        Long expiresIn
) {
    public static TokenResponse of(String accessToken, Long expiresIn) {
        return new TokenResponse(accessToken, "Bearer", expiresIn);
    }
}
