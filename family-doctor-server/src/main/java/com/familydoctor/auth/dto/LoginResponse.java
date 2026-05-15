package com.familydoctor.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    private Long userId;
    private String phone;
    private String nickname;
    private String role;
}
