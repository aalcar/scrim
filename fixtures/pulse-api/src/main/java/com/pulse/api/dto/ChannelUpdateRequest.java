package com.pulse.api.dto;

import jakarta.validation.constraints.Size;

/**
 * Fields that may be changed after creation. A null field means "leave alone".
 *
 * <p>The channel type is immutable — callers delete and recreate instead.
 */
public record ChannelUpdateRequest(
        @Size(max = 120) String name,
        @Size(max = 200) String targetRef,
        Boolean enabled) {
}
