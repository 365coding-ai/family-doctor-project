package com.familydoctor.doctor.controller;

import com.familydoctor.common.exception.BusinessException;
import com.familydoctor.common.result.Result;
import com.familydoctor.doctor.entity.Doctor;
import com.familydoctor.doctor.entity.DoctorSchedule;
import com.familydoctor.doctor.repository.DoctorRepository;
import com.familydoctor.doctor.repository.DoctorScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 医生接口 (公开)
 */
@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository scheduleRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 搜索医生
     */
    @GetMapping
    public Result<Page<Doctor>> searchDoctors(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest pageable = PageRequest.of(page, size);

        if (keyword != null && !keyword.isBlank()) {
            return Result.success(doctorRepository.searchByKeyword(keyword, pageable));
        }
        if (department != null && !department.isBlank()) {
            return Result.success(doctorRepository.findByDepartmentLike(department, pageable));
        }
        return Result.success(doctorRepository.findAll(pageable));
    }

    /**
     * 医生详情
     */
    @GetMapping("/{id}")
    public Result<Doctor> getDoctorDetail(@PathVariable Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "医生不存在"));
        return Result.success(doctor);
    }

    /**
     * 获取医生排班（指定日期）
     */
    @GetMapping("/{id}/schedules")
    public Result<List<DoctorSchedule>> getSchedules(
            @PathVariable Long id,
            @RequestParam(required = false) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return Result.success(scheduleRepository.findByDoctorIdAndDateOrderByTimeSlot(id, date));
    }

    /**
     * 获取附近医生 (基于 Redis GEO)
     * TODO: Phase 2 实现 Redis GEORADIUS 查询
     */
    @GetMapping("/nearby")
    public Result<List<com.familydoctor.doctor.dto.NearbyDoctorVO>> getNearbyDoctors(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radiusKm) {
        // MVP: 返回所有可上门的在线医生
        return Result.success(doctorRepository.findNearbyDoctorsWithUser(1));
    }
}
