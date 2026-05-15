package com.familydoctor.auth.service;

import com.familydoctor.auth.dto.LoginRequest;
import com.familydoctor.auth.dto.LoginResponse;
import com.familydoctor.common.exception.BusinessException;
import com.familydoctor.common.util.JwtUtil;
import com.familydoctor.user.entity.User;
import com.familydoctor.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 认证服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final com.familydoctor.user.repository.UserRepository userRepository;
    private final com.familydoctor.doctor.repository.DoctorRepository doctorRepository;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String SMS_CODE_PREFIX = "sms:code:";

    /**
     * 发送验证码（MVP 阶段直接用固定验证码 123456）
     */
    public void sendSmsCode(String phone) {
        String code = "123456"; // TODO: 对接短信服务
        redisTemplate.opsForValue().set(SMS_CODE_PREFIX + phone, code, 5, TimeUnit.MINUTES);
        log.info("验证码已发送到 {}: {}", phone, code);
    }

    /**
     * 手机号 + 验证码登录（自动注册）
     */
    public LoginResponse login(LoginRequest request) {
        // 1. 验证码校验
        String cachedCode = (String) redisTemplate.opsForValue().get(SMS_CODE_PREFIX + request.getPhone());
        if (cachedCode == null || !cachedCode.equals(request.getCode())) {
            // MVP 阶段: 允许 123456 通过
            if (!"123456".equals(request.getCode())) {
                throw new BusinessException("验证码错误或已过期");
            }
        }

        // 2. 查找或创建用户
        User user = userRepository.findByPhone(request.getPhone())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setPhone(request.getPhone());
                    newUser.setNickname("用户" + request.getPhone().substring(7));
                    return userRepository.save(newUser);
                });

        // 检查并同步医生角色
        if (doctorRepository.findByPhone(user.getPhone()).isPresent()) {
            com.familydoctor.doctor.entity.Doctor doctor = doctorRepository.findByPhone(user.getPhone()).get();
            
            // 同步角色
            if (!"ROLE_DOCTOR".equals(user.getRole())) {
                user.setRole("ROLE_DOCTOR");
                userRepository.save(user);
            }
            
            // 绑定 userId 到医生表 (如果尚未绑定)
            if (doctor.getUserId() == null) {
                doctor.setUserId(user.getId());
                doctorRepository.save(doctor);
                
                // 同时更新用户昵称为医生真实姓名
                user.setNickname(doctor.getName());
                userRepository.save(user);
            }
        }

        // 3. 生成 Token
        String accessToken = jwtUtil.generateToken(user.getId(), user.getPhone(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        // 4. 清除验证码
        redisTemplate.delete(SMS_CODE_PREFIX + request.getPhone());

        return new LoginResponse(accessToken, refreshToken, user.getId(), user.getPhone(), user.getNickname(), user.getRole());
    }
}
