package kr.ac.cnu.chachastudy.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiResponseParser {

    private final ObjectMapper objectMapper;

    public <T> T parse(String raw, Class<T> clazz) {
        try {
            String json = raw.strip();
            if (json.startsWith("```")) {
                json = json.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").strip();
            }
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            log.error("AI 응답 JSON 파싱 실패: {}", raw);
            throw new BusinessException(ErrorCode.AI_API_FAILED);
        }
    }
}
