package com.pulse.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import java.time.Instant;

/**
 * A destination the platform can deliver messages to.
 *
 * <p>{@code pulse-api} owns the channel record and its display metadata.
 * Credentials live in dispatch-service and are referenced here only by
 * {@link #targetRef}, so a leaked pulse-api database does not leak tokens.
 */
@Entity
@Table(
        name = "channels",
        indexes = {
                @Index(name = "idx_channels_org_created", columnList = "org_id, created_at"),
                @Index(name = "idx_channels_public_id", columnList = "public_id", unique = true)
        },
        uniqueConstraints = @UniqueConstraint(
                name = "uq_channels_org_name", columnNames = {"org_id", "name"})
)
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, length = 40)
    private String publicId;

    @Column(name = "org_id", nullable = false, updatable = false, length = 40)
    private String orgId;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChannelType type;

    /** Opaque handle to the credential and destination held by dispatch-service. */
    @Column(name = "target_ref", nullable = false, length = 200)
    private String targetRef;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Channel() {
        // for JPA
    }

    public Channel(String orgId, String name, ChannelType type, String targetRef) {
        this.publicId = Ids.generate("ch");
        this.orgId = orgId;
        this.name = name;
        this.type = type;
        this.targetRef = targetRef;
        this.enabled = true;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void rename(String name) {
        this.name = name;
        touch();
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
        touch();
    }

    public void setTargetRef(String targetRef) {
        this.targetRef = targetRef;
        touch();
    }

    private void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getPublicId() {
        return publicId;
    }

    public String getOrgId() {
        return orgId;
    }

    public String getName() {
        return name;
    }

    public ChannelType getType() {
        return type;
    }

    public String getTargetRef() {
        return targetRef;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getVersion() {
        return version;
    }
}
