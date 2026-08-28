package com.pulse.api.exception;

/** Thrown when a downstream internal service could not be reached or failed. */
public class UpstreamUnavailableException extends RuntimeException {

    private final String service;

    public UpstreamUnavailableException(String service, String message, Throwable cause) {
        super(message, cause);
        this.service = service;
    }

    public String getService() {
        return service;
    }
}
