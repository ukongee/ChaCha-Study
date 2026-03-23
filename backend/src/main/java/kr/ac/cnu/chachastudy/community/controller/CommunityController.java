package kr.ac.cnu.chachastudy.community.controller;

import jakarta.validation.Valid;
import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.community.dto.PostCreateRequest;
import kr.ac.cnu.chachastudy.community.dto.PostResponse;
import kr.ac.cnu.chachastudy.community.service.CommunityService;
import kr.ac.cnu.chachastudy.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PostCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("게시글이 등록되었습니다.", communityService.createPost(userId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getPosts(
            @RequestParam(required = false) Department department,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(communityService.getPosts(department, pageable)));
    }

    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getPopularPosts(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(communityService.getPopularPosts(pageable)));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(@PathVariable Long postId) {
        return ResponseEntity.ok(ApiResponse.ok(communityService.getPost(postId)));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> likePost(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId
    ) {
        communityService.likePost(userId, postId);
        return ResponseEntity.ok(ApiResponse.ok("좋아요를 눌렀습니다."));
    }

    @DeleteMapping("/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> unlikePost(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId
    ) {
        communityService.unlikePost(userId, postId);
        return ResponseEntity.ok(ApiResponse.ok("좋아요를 취소했습니다."));
    }
}
