package com.careertrack.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public final class ApplicationDtos {
    private ApplicationDtos() {}

    public record ApplicationRequest(
        @NotBlank @Size(max = 120) String company,
        @NotBlank @Size(max = 140) String role,
        @Size(max = 120) String location,
        ApplicationStatus status,
        LocalDate appliedDate,
        @Size(max = 2048) String jobUrl,
        @Size(max = 2000) String notes
    ) {}

    public record ApplicationView(Long id, String company, String role, String location,
                                  ApplicationStatus status, LocalDate appliedDate, String jobUrl,
                                  String notes, Instant createdAt, Instant updatedAt) {
        static ApplicationView from(JobApplication application) {
            return new ApplicationView(application.getId(), application.getCompany(), application.getRole(),
                application.getLocation(), application.getStatus(), application.getAppliedDate(),
                application.getJobUrl(), application.getNotes(), application.getCreatedAt(), application.getUpdatedAt());
        }
    }

    public record DashboardView(long total, long saved, long applied, long interview, long offer, long rejected) {}
}
