package kr.ac.cnu.chachastudy.community.service;

import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.auth.domain.User;
import kr.ac.cnu.chachastudy.auth.repository.UserRepository;
import kr.ac.cnu.chachastudy.community.domain.Post;
import kr.ac.cnu.chachastudy.community.domain.PostLike;
import kr.ac.cnu.chachastudy.community.dto.PostCreateRequest;
import kr.ac.cnu.chachastudy.community.dto.PostResponse;
import kr.ac.cnu.chachastudy.community.repository.PostLikeRepository;
import kr.ac.cnu.chachastudy.community.repository.PostRepository;
import kr.ac.cnu.chachastudy.global.exception.BusinessException;
import kr.ac.cnu.chachastudy.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;

    @Transactional
    public PostResponse createPost(Long userId, PostCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Post post = Post.builder()
                .user(user)
                .title(request.title())
                .content(request.content())
                .courseName(request.courseName())
                .department(request.department())
                .anonymous(request.anonymous())
                .build();

        return PostResponse.from(postRepository.save(post));
    }

    public Page<PostResponse> getPosts(Department department, Pageable pageable) {
        if (department != null) {
            return postRepository.findByDepartmentOrderByCreatedAtDesc(department, pageable)
                    .map(PostResponse::from);
        }
        return postRepository.findAllByOrderByCreatedAtDesc(pageable).map(PostResponse::from);
    }

    public Page<PostResponse> getPopularPosts(Pageable pageable) {
        return postRepository.findAllByOrderByLikeCountDesc(pageable).map(PostResponse::from);
    }

    @Transactional
    public PostResponse getPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        post.incrementViewCount();
        return PostResponse.from(post);
    }

    @Transactional
    public void likePost(Long userId, Long postId) {
        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new BusinessException(ErrorCode.ALREADY_LIKED);
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        postLikeRepository.save(PostLike.builder().post(post).user(user).build());
        post.incrementLikeCount();
    }

    @Transactional
    public void unlikePost(Long userId, Long postId) {
        PostLike like = postLikeRepository.findByPostIdAndUserId(postId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        postLikeRepository.delete(like);
        post.decrementLikeCount();
    }
}
