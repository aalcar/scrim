package com.pulse.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.pulse.api.client.DispatchClient;
import com.pulse.api.client.dto.VerifyTargetResponse;
import com.pulse.api.dto.ChannelCreateRequest;
import com.pulse.api.exception.ConflictException;
import com.pulse.api.exception.ResourceNotFoundException;
import com.pulse.api.model.Channel;
import com.pulse.api.model.ChannelType;
import com.pulse.api.repository.ChannelRepository;
import com.pulse.api.web.TenantContext;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChannelServiceTest {

    private static final String ORG = "org_test";

    @Mock
    private ChannelRepository channelRepository;

    @Mock
    private DispatchClient dispatchClient;

    @InjectMocks
    private ChannelService channelService;

    @BeforeEach
    void bindTenant() {
        TenantContext.setOrgId(ORG);
    }

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void createVerifiesTargetBeforePersisting() {
        given(channelRepository.existsByOrgIdAndName(ORG, "oncall-slack")).willReturn(false);
        given(dispatchClient.verifyTarget(ChannelType.SLACK, "slack:C0123"))
                .willReturn(new VerifyTargetResponse(true, null));
        given(channelRepository.save(any(Channel.class))).willAnswer(call -> call.getArgument(0));

        Channel created = channelService.create(
                new ChannelCreateRequest("oncall-slack", ChannelType.SLACK, "slack:C0123"));

        assertThat(created.getPublicId()).startsWith("ch_");
        assertThat(created.getOrgId()).isEqualTo(ORG);
        assertThat(created.isEnabled()).isTrue();
    }

    @Test
    void createRejectsDuplicateNameWithoutCallingDispatch() {
        given(channelRepository.existsByOrgIdAndName(ORG, "oncall-slack")).willReturn(true);

        assertThatThrownBy(() -> channelService.create(
                new ChannelCreateRequest("oncall-slack", ChannelType.SLACK, "slack:C0123")))
                .isInstanceOf(ConflictException.class);

        verify(dispatchClient, never()).verifyTarget(any(), any());
        verify(channelRepository, never()).save(any());
    }

    @Test
    void createRejectsTargetDispatchCannotDeliverTo() {
        given(channelRepository.existsByOrgIdAndName(ORG, "broken")).willReturn(false);
        given(dispatchClient.verifyTarget(ChannelType.WEBHOOK, "https://example.invalid"))
                .willReturn(new VerifyTargetResponse(false, "unreachable host"));

        assertThatThrownBy(() -> channelService.create(
                new ChannelCreateRequest("broken", ChannelType.WEBHOOK, "https://example.invalid")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unreachable host");

        verify(channelRepository, never()).save(any());
    }

    @Test
    void getDoesNotLeakChannelsFromAnotherOrg() {
        given(channelRepository.findByOrgIdAndPublicId(ORG, "ch_other")).willReturn(Optional.empty());

        assertThatThrownBy(() -> channelService.get("ch_other"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
