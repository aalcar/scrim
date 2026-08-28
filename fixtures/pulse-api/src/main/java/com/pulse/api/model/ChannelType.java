package com.pulse.api.model;

/** Delivery mechanisms supported by dispatch-service. */
public enum ChannelType {
    SLACK,
    PAGERDUTY,
    WEBHOOK,
    EMAIL
}
