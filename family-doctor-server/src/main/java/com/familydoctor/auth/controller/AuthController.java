package com.familydoctor.auth.controller;

import com.familydoctor.auth.dto.LoginRequest;
import com.familydoctor.auth.dto.LoginResponse;
import com.familydoctor.auth.service.AuthService;
import com.familydoctor.common.result.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证接口
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 发送短信验证码
     */
    @PostMapping("/sms-code")
    public Result<Void> sendSmsCode(@RequestParam String phone) {
        authService.sendSmsCode(phone);
        return Result.success();
    }

    /**
     * 手机号 + 验证码登录
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return Result.success(authService.login(request));
    }
}
