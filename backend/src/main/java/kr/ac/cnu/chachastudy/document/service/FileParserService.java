package kr.ac.cnu.chachastudy.document.service;

import kr.ac.cnu.chachastudy.document.domain.FileType;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.sl.usermodel.Slide;
import org.apache.poi.sl.usermodel.SlideShow;
import org.apache.poi.sl.usermodel.TextShape;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class FileParserService {

    public ParseResult parse(MultipartFile file, FileType fileType) {
        try {
            return switch (fileType) {
                case PDF -> parsePdf(file);
                case PPT, PPTX -> parsePptx(file);
            };
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("File parse failed: {}", e.getMessage());
            throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
        }
    }

    private ParseResult parsePdf(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            return new ParseResult(text.trim(), document.getNumberOfPages());
        }
    }

    private ParseResult parsePptx(MultipartFile file) throws IOException {
        try (XMLSlideShow ppt = new XMLSlideShow(file.getInputStream())) {
            List<String> slideTexts = new ArrayList<>();

            for (Slide<?, ?> slide : ppt.getSlides()) {
                StringBuilder slideText = new StringBuilder();
                for (var shape : slide.getShapes()) {
                    if (shape instanceof TextShape<?, ?> textShape) {
                        String text = textShape.getText();
                        if (text != null && !text.isBlank()) {
                            slideText.append(text).append("\n");
                        }
                    }
                }
                if (!slideText.isEmpty()) {
                    slideTexts.add(slideText.toString().trim());
                }
            }

            String fullText = String.join("\n\n--- 슬라이드 구분 ---\n\n", slideTexts);
            return new ParseResult(fullText, ppt.getSlides().size());
        }
    }

    public record ParseResult(String text, int pageCount) {}
}
