package kr.ac.cnu.chachastudy.ai.client;

import kr.ac.cnu.chachastudy.ai.dto.AiChatRequest;
import kr.ac.cnu.chachastudy.ai.dto.AiChatResponse;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
public class AiApiClient {

    private final WebClient webClient;

    public AiApiClient(@Value("${ai.base-url}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * 충남대 AI API 호출 (OpenAI 호환)
     * 사용자의 API 키를 직접 헤더에 전달 — 서버에 키를 저장하지 않음
     */
    public String chat(String apiKey, AiChatRequest request) {
        if (!StringUtils.hasText(apiKey)) {
            throw new BusinessException(ErrorCode.AI_API_KEY_MISSING);
        }

        try {
            AiChatResponse response = webClient.post()
                    .uri("/v1/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiChatResponse.class)
                    .block();

            if (response == null || response.getContent().isBlank()) {
                throw new BusinessException(ErrorCode.AI_API_FAILED);
            }

            return response.getContent();
        } catch (BusinessException e) {
            throw e;
        } catch (WebClientResponseException e) {
            log.error("AI API error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.AI_API_FAILED);
        } catch (Exception e) {
            log.error("AI API unexpected error", e);
            throw new BusinessException(ErrorCode.AI_API_FAILED);
        }
    }
}
