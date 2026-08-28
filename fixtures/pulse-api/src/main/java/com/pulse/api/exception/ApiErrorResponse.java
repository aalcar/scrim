package com.pulse.api.exception;

import java.util.List;

/**
 * The single error body shape for every endpoint.
 *
 * @param code      stable machine-readable code, e.g. {@code channel_not_found}
 * @param message   human-readable description, safe to show to an operator
 * @param details   optional per-field problems, populated for validation failures
 * @param requestId echoed back so support can find the request in the logs
 */
public record ApiErrorResponse(
        String code,
        String message,
        List<FieldProblem> details,
        String requestId) {

    public record FieldProblem(String field, String message) {
    }

    public static ApiErrorResponse of(String code, String message, String requestId) {
        return new ApiErrorResponse(code, message, null, requestId);
    }
}
