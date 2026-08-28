package com.pulse.api.dto;

/**
 * @param accepted number of datapoints written
 * @param rejected number of datapoints dropped by validation
 */
public record IngestResponse(int accepted, int rejected) {
}
