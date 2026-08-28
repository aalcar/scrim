package com.pulse.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tunables for the service, bound from the {@code pulse.*} block of the config.
 *
 * @param ingest   limits applied to the write path
 * @param query    limits applied to the read path
 * @param dispatch connection settings for dispatch-service
 */
@ConfigurationProperties(prefix = "pulse")
public record PulseProperties(Ingest ingest, Query query, Dispatch dispatch) {

    public record Ingest(int maxBatchSize) {
    }

    public record Query(int maxRangeHours, int maxSeries) {
    }

    public record Dispatch(String baseUrl) {
    }
}
