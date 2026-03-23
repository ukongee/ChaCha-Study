package kr.ac.cnu.chachastudy.chat.repository;

import kr.ac.cnu.chachastudy.chat.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByDocumentIdOrderByCreatedAtAsc(Long documentId);

    void deleteByDocumentId(Long documentId);
}
