package com.pulse.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

/**
 * A batch of datapoints from a single agent.
 *
 * @param points the datapoints, capped by {@code pulse.ingest.max-batch-size}
 */
public record IngestRequest(@NotEmpty @Valid List<Datapoint> points) {

    /**
     * @param metric      metric name, e.g. {@code http.server.requests}
     * @param tags        dimensions for this series
     * @param timestampMs collection time in epoch milliseconds, UTC
     * @param value       the sample
     */
    public record Datapoint(
            @NotBlank @Size(max = 200) String metric,
            Map<String, String> tags,
            long timestampMs,
            double value) {
    }
}
