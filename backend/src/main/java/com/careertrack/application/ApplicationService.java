package com.careertrack.application;

import com.careertrack.common.ApiException;
import com.careertrack.user.User;
import com.careertrack.user.UserRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {
    private final JobApplicationRepository applications;
    private final UserRepository users;

    public ApplicationService(JobApplicationRepository applications, UserRepository users) {
        this.applications = applications;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<ApplicationDtos.ApplicationView> list(Long userId, String query, ApplicationStatus status) {
        String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return applications.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
            .filter(item -> status == null || item.getStatus() == status)
            .filter(item -> needle.isBlank() || (item.getCompany() + " " + item.getRole() + " "
                + (item.getLocation() == null ? "" : item.getLocation())).toLowerCase(Locale.ROOT).contains(needle))
            .map(ApplicationDtos.ApplicationView::from).toList();
    }

    @Transactional
    public ApplicationDtos.ApplicationView create(Long userId, ApplicationDtos.ApplicationRequest request) {
        User user = users.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));
        JobApplication item = applications.save(new JobApplication(user, request.company().trim(), request.role().trim(),
            clean(request.location()), statusOrDefault(request.status()), request.appliedDate(),
            clean(request.jobUrl()), clean(request.notes())));
        return ApplicationDtos.ApplicationView.from(item);
    }

    @Transactional
    public ApplicationDtos.ApplicationView update(Long userId, Long id, ApplicationDtos.ApplicationRequest request) {
        JobApplication item = findOwned(userId, id);
        item.update(request.company().trim(), request.role().trim(), clean(request.location()),
            statusOrDefault(request.status()), request.appliedDate(), clean(request.jobUrl()), clean(request.notes()));
        return ApplicationDtos.ApplicationView.from(item);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        applications.delete(findOwned(userId, id));
    }

    @Transactional(readOnly = true)
    public ApplicationDtos.DashboardView dashboard(Long userId) {
        long saved = applications.countByUserIdAndStatus(userId, ApplicationStatus.SAVED);
        long applied = applications.countByUserIdAndStatus(userId, ApplicationStatus.APPLIED);
        long interview = applications.countByUserIdAndStatus(userId, ApplicationStatus.INTERVIEW);
        long offer = applications.countByUserIdAndStatus(userId, ApplicationStatus.OFFER);
        long rejected = applications.countByUserIdAndStatus(userId, ApplicationStatus.REJECTED);
        long withdrawn = applications.countByUserIdAndStatus(userId, ApplicationStatus.WITHDRAWN);
        return new ApplicationDtos.DashboardView(saved + applied + interview + offer + rejected + withdrawn,
            saved, applied, interview, offer, rejected);
    }

    private JobApplication findOwned(Long userId, Long id) {
        return applications.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found."));
    }

    private ApplicationStatus statusOrDefault(ApplicationStatus status) {
        return status == null ? ApplicationStatus.SAVED : status;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
