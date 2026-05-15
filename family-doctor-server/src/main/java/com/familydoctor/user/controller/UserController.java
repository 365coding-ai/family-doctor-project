package com.familydoctor.user.controller;

import com.familydoctor.common.result.Result;
import com.familydoctor.user.entity.User;
import com.familydoctor.user.entity.UserAddress;
import com.familydoctor.user.repository.UserAddressRepository;
import com.familydoctor.user.repository.UserRepository;
import com.familydoctor.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户接口
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserAddressRepository addressRepository;

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public Result<User> getCurrentUser(@AuthenticationPrincipal Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        return Result.success(user);
    }

    /**
     * 获取指定用户信息 (基本资料)
     */
    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        return Result.success(user);
    }

    /**
     * 更新个人资料
     */
    @PutMapping("/me")
    public Result<User> updateProfile(@AuthenticationPrincipal Long userId,
                                      @RequestBody User updates) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        if (updates.getNickname() != null) user.setNickname(updates.getNickname());
        if (updates.getAvatarUrl() != null) user.setAvatarUrl(updates.getAvatarUrl());
        if (updates.getGender() != null) user.setGender(updates.getGender());
        if (updates.getBirthDate() != null) user.setBirthDate(updates.getBirthDate());
        return Result.success(userRepository.save(user));
    }

    // ==================== 地址管理 ====================

    /**
     * 获取用户地址列表
     */
    @GetMapping("/me/addresses")
    public Result<List<UserAddress>> getAddresses(@AuthenticationPrincipal Long userId) {
        return Result.success(addressRepository.findByUserIdOrderByIsDefaultDesc(userId));
    }

    /**
     * 新增地址
     */
    @PostMapping("/me/addresses")
    public Result<UserAddress> addAddress(@AuthenticationPrincipal Long userId,
                                          @RequestBody UserAddress address) {
        address.setUserId(userId);
        return Result.success(addressRepository.save(address));
    }

    /**
     * 更新地址
     */
    @PutMapping("/me/addresses/{id}")
    public Result<UserAddress> updateAddress(@AuthenticationPrincipal Long userId,
                                             @PathVariable Long id,
                                             @RequestBody UserAddress updates) {
        UserAddress address = addressRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "地址不存在"));
        if (!address.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作");
        }
        if (updates.getName() != null) address.setName(updates.getName());
        if (updates.getPhone() != null) address.setPhone(updates.getPhone());
        if (updates.getProvince() != null) address.setProvince(updates.getProvince());
        if (updates.getCity() != null) address.setCity(updates.getCity());
        if (updates.getDistrict() != null) address.setDistrict(updates.getDistrict());
        if (updates.getDetail() != null) address.setDetail(updates.getDetail());
        if (updates.getLatitude() != null) address.setLatitude(updates.getLatitude());
        if (updates.getLongitude() != null) address.setLongitude(updates.getLongitude());
        if (updates.getIsDefault() != null) address.setIsDefault(updates.getIsDefault());
        return Result.success(addressRepository.save(address));
    }

    /**
     * 删除地址
     */
    @DeleteMapping("/me/addresses/{id}")
    public Result<Void> deleteAddress(@AuthenticationPrincipal Long userId,
                                      @PathVariable Long id) {
        UserAddress address = addressRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "地址不存在"));
        if (!address.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作");
        }
        addressRepository.delete(address);
        return Result.success();
    }
}
