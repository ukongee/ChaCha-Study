package kr.ac.cnu.chachastudy.ai.dto;

import java.util.List;

public record SummaryResponse(
        String briefSummary,
        String detailedSummary,
        List<String> keywords,
        List<String> importantPoints
) {}
