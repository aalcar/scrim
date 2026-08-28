package com.pulse.api.dto;

import com.pulse.api.model.ChannelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * @param name      operator-facing label, unique within the org
 * @param type      delivery mechanism
 * @param targetRef handle registered with dispatch-service for this destination
 */
public record ChannelCreateRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull ChannelType type,
        @NotBlank @Size(max = 200) String targetRef) {
}
