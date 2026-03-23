package kr.ac.cnu.chachastudy.document.repository;

import kr.ac.cnu.chachastudy.document.domain.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);
}
