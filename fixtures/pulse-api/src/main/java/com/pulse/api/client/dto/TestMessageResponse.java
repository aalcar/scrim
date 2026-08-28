package com.pulse.api.client.dto;

/**
 * @param deliveryId dispatch-service handle for this send, useful in support tickets
 * @param status     one of {@code queued}, {@code delivered}, {@code failed}
 */
public record TestMessageResponse(String deliveryId, String status) {
}
