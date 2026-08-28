package com.pulse.api.client.dto;

/**
 * @param valid  whether dispatch-service recognises the target and holds usable credentials
 * @param reason populated when {@code valid} is false
 */
public record VerifyTargetResponse(boolean valid, String reason) {
}
