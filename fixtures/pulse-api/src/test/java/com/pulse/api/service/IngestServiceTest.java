package com.pulse.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulse.api.config.PulseProperties;
import com.pulse.api.dto.IngestRequest;
import com.pulse.api.dto.IngestResponse;
import com.pulse.api.repository.MetricPointRepository;
import com.pulse.api.web.TenantContext;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IngestServiceTest {

    private static final String ORG = "org_test";
    private static final long THREE_HOURS_MS = 3 * 60 * 60 * 1000L;

    @Mock
    private MetricPointRepository metricPointRepository;

    private IngestService ingestService;

    @BeforeEach
    void setUp() {
        PulseProperties properties = new PulseProperties(
                new PulseProperties.Ingest(1000),
                new PulseProperties.Query(168, 500),
                new PulseProperties.Dispatch("http://localhost"));
        ingestService = new IngestService(metricPointRepository, properties);
        TenantContext.setOrgId(ORG);
    }

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void encodesTagsSortedByKeySoSeriesAreStable() {
        Map<String, String> tags = new LinkedHashMap<>();
        tags.put("region", "us-east-1");
        tags.put("host", "web-1");

        assertThat(IngestService.encodeTags(tags)).isEqualTo("host=web-1,region=us-east-1");
        assertThat(IngestService.encodeTags(Map.of())).isEmpty();
        assertThat(IngestService.encodeTags(null)).isEmpty();
    }

    @Test
    void dropsPointsOutsideTheAcceptedTimeWindow() {
        long now = Instant.now().toEpochMilli();
        IngestResponse response = ingestService.ingest(new IngestRequest(List.of(
                point("cpu.util", now),
                point("cpu.util", now - THREE_HOURS_MS),
                point("cpu.util", now + THREE_HOURS_MS))));

        assertThat(response.accepted()).isEqualTo(1);
        assertThat(response.rejected()).isEqualTo(2);
    }

    @Test
    void rejectsBatchesOverTheConfiguredLimit() {
        List<IngestRequest.Datapoint> tooMany = IntStream.range(0, 1001)
                .mapToObj(i -> point("cpu.util", Instant.now().toEpochMilli()))
                .toList();

        assertThatThrownBy(() -> ingestService.ingest(new IngestRequest(tooMany)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds the limit");
    }

    private static IngestRequest.Datapoint point(String metric, long timestampMs) {
        return new IngestRequest.Datapoint(metric, Map.of("host", "web-1"), timestampMs, 1.0);
    }
}
