package com.pulse.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulse.api.dto.ChannelCreateRequest;
import com.pulse.api.exception.ResourceNotFoundException;
import com.pulse.api.model.Channel;
import com.pulse.api.model.ChannelType;
import com.pulse.api.service.ChannelService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ChannelController.class)
class ChannelControllerTest {

    private static final String ORG = "org_test";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ChannelService channelService;

    @Test
    void rejectsRequestWithoutOrgHeader() throws Exception {
        mockMvc.perform(get("/v1/channels"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createReturns201WithLocation() throws Exception {
        Channel channel = new Channel(ORG, "oncall-slack", ChannelType.SLACK, "slack:C0123");
        given(channelService.create(any())).willReturn(channel);

        var request = new ChannelCreateRequest("oncall-slack", ChannelType.SLACK, "slack:C0123");

        mockMvc.perform(post("/v1/channels")
                        .header("X-Org-Id", ORG)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/v1/channels/" + channel.getPublicId()))
                .andExpect(jsonPath("$.id").value(channel.getPublicId()))
                .andExpect(jsonPath("$.name").value("oncall-slack"));
    }

    @Test
    void createRejectsBlankName() throws Exception {
        var request = new ChannelCreateRequest("  ", ChannelType.SLACK, "slack:C0123");

        mockMvc.perform(post("/v1/channels")
                        .header("X-Org-Id", ORG)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("validation_failed"))
                .andExpect(jsonPath("$.details[0].field").value("name"));
    }

    @Test
    void listClampsLimitToMaximum() throws Exception {
        given(channelService.list(100, 0)).willReturn(List.of());
        given(channelService.count()).willReturn(0L);

        mockMvc.perform(get("/v1/channels").header("X-Org-Id", ORG).param("limit", "5000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.limit").value(100));
    }

    @Test
    void unknownChannelReturns404WithErrorCode() throws Exception {
        willThrow(new ResourceNotFoundException("channel_not_found", "No channel with id ch_missing"))
                .given(channelService).get("ch_missing");

        mockMvc.perform(get("/v1/channels/ch_missing").header("X-Org-Id", ORG))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("channel_not_found"));
    }
}
