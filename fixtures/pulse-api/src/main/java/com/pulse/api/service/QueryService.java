package com.pulse.api.service;

import com.pulse.api.config.PulseProperties;
import com.pulse.api.model.MetricPoint;
import com.pulse.api.repository.MetricPointRepository;
import com.pulse.api.web.TenantContext;
import java.time.Duration;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The read path used by the console's chart widgets.
 */
@Service
public class QueryService {

    private static final int MAX_POINTS = 20_000;

    private final MetricPointRepository metricPointRepository;
    private final PulseProperties properties;

    public QueryService(MetricPointRepository metricPointRepository, PulseProperties properties) {
        this.metricPointRepository = metricPointRepository;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public List<MetricPoint> range(String metric, long fromMs, long toMs) {
        if (toMs <= fromMs) {
            throw new IllegalArgumentException("'to' must be greater than 'from'");
        }
        long maxRangeMs = Duration.ofHours(properties.query().maxRangeHours()).toMillis();
        if (toMs - fromMs > maxRangeMs) {
            throw new IllegalArgumentException(
                    "Range exceeds the maximum of " + properties.query().maxRangeHours() + " hours");
        }
        return metricPointRepository.findRange(TenantContext.requireOrgId(), metric, fromMs, toMs,
                PageRequest.ofSize(MAX_POINTS));
    }

    @Transactional(readOnly = true)
    public List<String> series(String metric) {
        List<String> tagSets = metricPointRepository.findTagSets(TenantContext.requireOrgId(), metric);
        int maxSeries = properties.query().maxSeries();
        return tagSets.size() > maxSeries ? tagSets.subList(0, maxSeries) : tagSets;
    }
}
