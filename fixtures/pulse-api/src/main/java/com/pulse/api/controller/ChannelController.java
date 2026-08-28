package com.pulse.api.controller;

import com.pulse.api.client.dto.TestMessageResponse;
import com.pulse.api.dto.ChannelCreateRequest;
import com.pulse.api.dto.ChannelResponse;
import com.pulse.api.dto.ChannelUpdateRequest;
import com.pulse.api.dto.PageResponse;
import com.pulse.api.model.Channel;
import com.pulse.api.service.ChannelService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Notification channels: the destinations the platform can deliver messages to.
 */
@RestController
@RequestMapping("/v1/channels")
public class ChannelController {

    private static final int DEFAULT_LIMIT = 25;
    private static final int MAX_LIMIT = 100;

    private final ChannelService channelService;

    public ChannelController(ChannelService channelService) {
        this.channelService = channelService;
    }

    @PostMapping
    public ResponseEntity<ChannelResponse> create(@Valid @RequestBody ChannelCreateRequest request) {
        Channel channel = channelService.create(request);
        return ResponseEntity
                .created(URI.create("/v1/channels/" + channel.getPublicId()))
                .body(ChannelResponse.from(channel));
    }

    @GetMapping
    public PageResponse<ChannelResponse> list(
            @RequestParam(defaultValue = "" + DEFAULT_LIMIT) int limit,
            @RequestParam(defaultValue = "0") int offset) {
        int effectiveLimit = Math.clamp(limit, 1, MAX_LIMIT);
        List<ChannelResponse> items = channelService.list(effectiveLimit, Math.max(offset, 0))
                .stream()
                .map(ChannelResponse::from)
                .toList();
        return new PageResponse<>(items, effectiveLimit, offset, channelService.count());
    }

    @GetMapping("/{channelId}")
    public ChannelResponse get(@PathVariable String channelId) {
        return ChannelResponse.from(channelService.get(channelId));
    }

    @PatchMapping("/{channelId}")
    public ChannelResponse update(@PathVariable String channelId,
                                  @Valid @RequestBody ChannelUpdateRequest request) {
        return ChannelResponse.from(channelService.update(channelId, request));
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> delete(@PathVariable String channelId) {
        channelService.delete(channelId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Sends a test message so an operator can confirm the channel is wired up.
     */
    @PostMapping("/{channelId}/test")
    public TestMessageResponse sendTest(@PathVariable String channelId) {
        return channelService.sendTest(channelId);
    }
}
