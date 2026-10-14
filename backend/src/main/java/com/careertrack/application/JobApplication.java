package com.careertrack.application;

import com.careertrack.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "job_applications", indexes = {
    @Index(name = "idx_application_owner_updated", columnList = "user_id, updated_at")
})
public class JobApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String company;

    @Column(nullable = false, length = 140)
    private String role;

    @Column(length = 120)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status;

    private LocalDate appliedDate;

    @Column(length = 2048)
    private String jobUrl;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected JobApplication() {}

    public JobApplication(User user, String company, String role, String location,
                          ApplicationStatus status, LocalDate appliedDate, String jobUrl, String notes) {
        this.user = user;
        this.company = company;
        this.role = role;
        this.location = location;
        this.status = status;
        this.appliedDate = appliedDate;
        this.jobUrl = jobUrl;
        this.notes = notes;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void update(String company, String role, String location, ApplicationStatus status,
                       LocalDate appliedDate, String jobUrl, String notes) {
        this.company = company;
        this.role = role;
        this.location = location;
        this.status = status;
        this.appliedDate = appliedDate;
        this.jobUrl = jobUrl;
        this.notes = notes;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getCompany() { return company; }
    public String getRole() { return role; }
    public String getLocation() { return location; }
    public ApplicationStatus getStatus() { return status; }
    public LocalDate getAppliedDate() { return appliedDate; }
    public String getJobUrl() { return jobUrl; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
