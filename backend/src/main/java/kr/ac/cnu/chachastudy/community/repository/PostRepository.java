package kr.ac.cnu.chachastudy.community.repository;

import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.community.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByDepartmentOrderByCreatedAtDesc(Department department, Pageable pageable);

    Page<Post> findAllByOrderByLikeCountDesc(Pageable pageable);
}
