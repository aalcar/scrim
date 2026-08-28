package com.pulse.api.controller;

import com.pulse.api.dto.IngestRequest;
import com.pulse.api.dto.IngestResponse;
import com.pulse.api.service.IngestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The agent-facing write path. This endpoint carries the overwhelming majority
 * of the service's traffic.
 */
@RestController
@RequestMapping("/v1/ingest")
public class IngestController {

    private final IngestService ingestService;

    public IngestController(IngestService ingestService) {
        this.ingestService = ingestService;
    }

    @PostMapping("/metrics")
    public IngestResponse ingestMetrics(@Valid @RequestBody IngestRequest request) {
        return ingestService.ingest(request);
    }
}
