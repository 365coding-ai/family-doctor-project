package com.familydoctor.doctor.dto;

public interface NearbyDoctorVO {
    Long getId();
    String getName();
    String getTitle();
    String getDepartment();
    String getHospital();
    String getAvatarUrl();
    java.math.BigDecimal getRating();
    Integer getServiceCount();
    String getIntroduction();
    Boolean getCanHomeVisit();
    Integer getStatus();
    Long getUserId();
}
