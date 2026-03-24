package kr.ac.cnu.chachastudy.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TranslationResponse(
        List<PageTranslation> pages
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PageTranslation(Integer page, String text) {}
}
