package com.pulse.api.controller;

import com.pulse.api.model.MetricPoint;
import com.pulse.api.service.QueryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The console-facing read path.
 */
@RestController
@RequestMapping("/v1/metrics")
public class QueryController {

    private final QueryService queryService;

    public QueryController(QueryService queryService) {
        this.queryService = queryService;
    }

    // TODO(PULSE-812): this returns the JPA entity straight out of the controller,
    // so org_id and the primary key end up on the wire. Needs a response DTO, but
    // the console pins the current field names. Coordinate before changing.
    @GetMapping("/query")
    public List<MetricPoint> query(@RequestParam String metric,
                                   @RequestParam long from,
                                   @RequestParam long to) {
        return queryService.range(metric, from, to);
    }

    @GetMapping("/series")
    public List<String> series(@RequestParam String metric) {
        return queryService.series(metric);
    }
}
