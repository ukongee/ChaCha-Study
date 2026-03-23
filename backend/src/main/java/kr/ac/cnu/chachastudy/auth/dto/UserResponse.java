package kr.ac.cnu.chachastudy.auth.dto;

import kr.ac.cnu.chachastudy.auth.domain.Department;
import kr.ac.cnu.chachastudy.auth.domain.User;

public record UserResponse(
        Long id,
        String email,
        String nickname,
        String department
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getDepartment().getLabel()
        );
    }
}
