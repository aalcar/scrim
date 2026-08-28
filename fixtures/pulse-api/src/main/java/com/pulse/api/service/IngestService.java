package com.pulse.api.service;

import com.pulse.api.config.PulseProperties;
import com.pulse.api.dto.IngestRequest;
import com.pulse.api.dto.IngestResponse;
import com.pulse.api.model.MetricPoint;
import com.pulse.api.repository.MetricPointRepository;
import com.pulse.api.web.TenantContext;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The write path. Agents call this on a fixed interval and retry on failure.
 */
@Service
public class IngestService {

    private static final Logger log = LoggerFactory.getLogger(IngestService.class);

    /** Points older than this are dropped; agents buffer for at most an hour. */
    private static final Duration MAX_BACKFILL = Duration.ofHours(2);

    /** Clocks on customer hosts drift; a little future skew is tolerated. */
    private static final Duration MAX_SKEW = Duration.ofMinutes(5);

    private final MetricPointRepository metricPointRepository;
    private final PulseProperties properties;

    public IngestService(MetricPointRepository metricPointRepository, PulseProperties properties) {
        this.metricPointRepository = metricPointRepository;
        this.properties = properties;
    }

    @Transactional
    public IngestResponse ingest(IngestRequest request) {
        int maxBatch = properties.ingest().maxBatchSize();
        if (request.points().size() > maxBatch) {
            throw new IllegalArgumentException(
                    "Batch of " + request.points().size() + " exceeds the limit of " + maxBatch);
        }

        String orgId = TenantContext.requireOrgId();
        long now = Instant.now().toEpochMilli();
        long oldest = now - MAX_BACKFILL.toMillis();
        long newest = now + MAX_SKEW.toMillis();

        List<MetricPoint> accepted = new ArrayList<>(request.points().size());
        int rejected = 0;
        for (IngestRequest.Datapoint point : request.points()) {
            if (point.timestampMs() < oldest || point.timestampMs() > newest) {
                rejected++;
                continue;
            }
            accepted.add(new MetricPoint(orgId, point.metric(), encodeTags(point.tags()),
                    point.timestampMs(), point.value()));
        }

        metricPointRepository.saveAll(accepted);
        if (rejected > 0) {
            log.info("Dropped {} out-of-window datapoints for org {}", rejected, orgId);
        }
        return new IngestResponse(accepted.size(), rejected);
    }

    /**
     * Renders tags as a canonical, key-sorted string so the same series always
     * produces the same {@code tag_set} value.
     */
    static String encodeTags(Map<String, String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return tags.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining(","));
    }
}
