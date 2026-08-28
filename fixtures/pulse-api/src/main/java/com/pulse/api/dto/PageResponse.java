package com.pulse.api.dto;

import java.util.List;

/**
 * Standard list envelope.
 *
 * @param items  the page of results
 * @param limit  page size that was applied
 * @param offset number of records skipped
 * @param total  total number of records matching the query
 */
public record PageResponse<T>(List<T> items, int limit, int offset, long total) {
}
