package com.pulse.api.exception;

/** Thrown when a resource does not exist, or exists but belongs to another org. */
public class ResourceNotFoundException extends RuntimeException {

    private final String code;

    public ResourceNotFoundException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
