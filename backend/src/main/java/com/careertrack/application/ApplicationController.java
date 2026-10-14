package com.careertrack.application;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ApplicationController {
    private final ApplicationService service;

    public ApplicationController(ApplicationService service) { this.service = service; }

    @GetMapping("/applications")
    public List<ApplicationDtos.ApplicationView> list(Authentication authentication,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ApplicationStatus status) {
        return service.list(userId(authentication), q, status);
    }

    @PostMapping("/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationDtos.ApplicationView create(Authentication authentication,
            @Valid @RequestBody ApplicationDtos.ApplicationRequest request) {
        return service.create(userId(authentication), request);
    }

    @PutMapping("/applications/{id}")
    public ApplicationDtos.ApplicationView update(Authentication authentication, @PathVariable Long id,
            @Valid @RequestBody ApplicationDtos.ApplicationRequest request) {
        return service.update(userId(authentication), id, request);
    }

    @DeleteMapping("/applications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable Long id) {
        service.delete(userId(authentication), id);
    }

    @GetMapping("/dashboard")
    public ApplicationDtos.DashboardView dashboard(Authentication authentication) {
        return service.dashboard(userId(authentication));
    }

    private Long userId(Authentication authentication) { return (Long) authentication.getPrincipal(); }
}
