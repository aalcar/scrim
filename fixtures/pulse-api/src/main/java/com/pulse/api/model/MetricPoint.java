package com.pulse.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * A single datapoint written by an agent.
 *
 * <p>In deployed environments this table is a Timescale hypertable partitioned
 * on {@code timestamp_ms}; the JPA mapping is kept deliberately dumb so the
 * partitioning stays a database concern.
 */
@Entity
@Table(
        name = "metric_points",
        indexes = @Index(name = "idx_points_org_metric_time",
                columnList = "org_id, metric_name, timestamp_ms")
)
public class MetricPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 40)
    private String orgId;

    @Column(name = "metric_name", nullable = false, length = 200)
    private String metricName;

    /** Serialised tag set, sorted by key, e.g. {@code host=web-1,region=us-east-1}. */
    @Column(name = "tag_set", nullable = false, length = 1000)
    private String tagSet;

    @Column(name = "timestamp_ms", nullable = false)
    private long timestampMs;

    @Column(nullable = false)
    private double value;

    protected MetricPoint() {
        // for JPA
    }

    public MetricPoint(String orgId, String metricName, String tagSet, long timestampMs, double value) {
        this.orgId = orgId;
        this.metricName = metricName;
        this.tagSet = tagSet;
        this.timestampMs = timestampMs;
        this.value = value;
    }

    public Long getId() {
        return id;
    }

    public String getOrgId() {
        return orgId;
    }

    public String getMetricName() {
        return metricName;
    }

    public String getTagSet() {
        return tagSet;
    }

    public long getTimestampMs() {
        return timestampMs;
    }

    public double getValue() {
        return value;
    }
}
