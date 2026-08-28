package com.pulse.api.service;

import com.pulse.api.client.DispatchClient;
import com.pulse.api.client.dto.TestMessageResponse;
import com.pulse.api.client.dto.VerifyTargetResponse;
import com.pulse.api.dto.ChannelCreateRequest;
import com.pulse.api.dto.ChannelUpdateRequest;
import com.pulse.api.exception.ConflictException;
import com.pulse.api.exception.ResourceNotFoundException;
import com.pulse.api.model.Channel;
import com.pulse.api.repository.ChannelRepository;
import com.pulse.api.web.TenantContext;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for notification channels.
 */
@Service
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final DispatchClient dispatchClient;

    public ChannelService(ChannelRepository channelRepository, DispatchClient dispatchClient) {
        this.channelRepository = channelRepository;
        this.dispatchClient = dispatchClient;
    }

    @Transactional
    public Channel create(ChannelCreateRequest request) {
        String orgId = TenantContext.requireOrgId();
        if (channelRepository.existsByOrgIdAndName(orgId, request.name())) {
            throw new ConflictException("channel_name_taken",
                    "A channel named '" + request.name() + "' already exists");
        }
        VerifyTargetResponse verification = dispatchClient.verifyTarget(request.type(), request.targetRef());
        if (!verification.valid()) {
            throw new IllegalArgumentException("Target rejected by dispatch-service: " + verification.reason());
        }
        return channelRepository.save(
                new Channel(orgId, request.name(), request.type(), request.targetRef()));
    }

    @Transactional(readOnly = true)
    public Channel get(String channelId) {
        return channelRepository.findByOrgIdAndPublicId(TenantContext.requireOrgId(), channelId)
                .orElseThrow(() -> new ResourceNotFoundException("channel_not_found",
                        "No channel with id " + channelId));
    }

    @Transactional(readOnly = true)
    public List<Channel> list(int limit, int offset) {
        String orgId = TenantContext.requireOrgId();
        return channelRepository.findPage(orgId, PageRequest.of(offset / limit, limit));
    }

    @Transactional(readOnly = true)
    public long count() {
        return channelRepository.countByOrgId(TenantContext.requireOrgId());
    }

    @Transactional
    public Channel update(String channelId, ChannelUpdateRequest request) {
        Channel channel = get(channelId);
        if (request.name() != null && !request.name().equals(channel.getName())) {
            if (channelRepository.existsByOrgIdAndName(channel.getOrgId(), request.name())) {
                throw new ConflictException("channel_name_taken",
                        "A channel named '" + request.name() + "' already exists");
            }
            channel.rename(request.name());
        }
        if (request.targetRef() != null) {
            channel.setTargetRef(request.targetRef());
        }
        if (request.enabled() != null) {
            channel.setEnabled(request.enabled());
        }
        return channelRepository.save(channel);
    }

    @Transactional
    public void delete(String channelId) {
        channelRepository.delete(get(channelId));
    }

    /**
     * Sends a test message through the channel so an operator can confirm setup.
     */
    public TestMessageResponse sendTest(String channelId) {
        Channel channel = get(channelId);
        return dispatchClient.sendTestMessage(
                channel.getTargetRef(),
                "pulse test notification",
                "This is a test message from channel '" + channel.getName() + "'.");
    }
}
