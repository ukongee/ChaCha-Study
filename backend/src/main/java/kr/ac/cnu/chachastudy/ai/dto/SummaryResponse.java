package kr.ac.cnu.chachastudy.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SummaryResponse(
        String briefSummary,
        String detailedSummary,
        List<Keyword> keywords,
        List<String> importantPoints,
        List<PageSummary> pageSummaries
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Keyword(String text, Integer page) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PageSummary(Integer page, String title, String summary) {}
}
