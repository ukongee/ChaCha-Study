package kr.ac.cnu.chachastudy.community.dto;

import kr.ac.cnu.chachastudy.community.domain.Post;

import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        String title,
        String content,
        String courseName,
        String department,
        String author,
        boolean anonymous,
        int likeCount,
        int viewCount,
        LocalDateTime createdAt
) {
    public static PostResponse from(Post post) {
        String author = post.isAnonymous() ? "익명" : post.getUser().getNickname();
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getCourseName(),
                post.getDepartment().getLabel(),
                author,
                post.isAnonymous(),
                post.getLikeCount(),
                post.getViewCount(),
                post.getCreatedAt()
        );
    }
}
