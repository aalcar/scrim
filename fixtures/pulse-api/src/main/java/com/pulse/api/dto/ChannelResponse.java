package com.pulse.api.dto;

import com.pulse.api.model.Channel;
import com.pulse.api.model.ChannelType;

public record ChannelResponse(
        String id,
        String name,
        ChannelType type,
        String targetRef,
        boolean enabled,
        long createdAt,
        long updatedAt) {

    public static ChannelResponse from(Channel channel) {
        return new ChannelResponse(
                channel.getPublicId(),
                channel.getName(),
                channel.getType(),
                channel.getTargetRef(),
                channel.isEnabled(),
                channel.getCreatedAt().toEpochMilli(),
                channel.getUpdatedAt().toEpochMilli());
    }
}
