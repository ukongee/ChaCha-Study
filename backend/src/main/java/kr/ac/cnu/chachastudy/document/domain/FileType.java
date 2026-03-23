package kr.ac.cnu.chachastudy.document.domain;

import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;

public enum FileType {
    PDF, PPT, PPTX;

    public static FileType from(String originalFilename) {
        if (originalFilename == null) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
        String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toUpperCase();
        return switch (ext) {
            case "PDF" -> PDF;
            case "PPT" -> PPT;
            case "PPTX" -> PPTX;
            default -> throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        };
    }
}
