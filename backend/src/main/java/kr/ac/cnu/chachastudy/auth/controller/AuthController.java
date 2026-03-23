package kr.ac.cnu.chachastudy.auth.controller;

import jakarta.validation.Valid;
import kr.ac.cnu.chachastudy.auth.dto.*;
import kr.ac.cnu.chachastudy.auth.service.AuthService;
import kr.ac.cnu.chachastudy.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signUp(@Valid @RequestBody SignUpRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("회원가입이 완료되었습니다.", authService.signUp(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getMe(userId)));
    }
}
