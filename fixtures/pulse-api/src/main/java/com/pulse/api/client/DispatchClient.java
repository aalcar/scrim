package com.pulse.api.client;

import com.pulse.api.client.dto.TestMessageRequest;
import com.pulse.api.client.dto.TestMessageResponse;
import com.pulse.api.client.dto.VerifyTargetRequest;
import com.pulse.api.client.dto.VerifyTargetResponse;
import com.pulse.api.exception.UpstreamUnavailableException;
import com.pulse.api.model.ChannelType;
import com.pulse.api.web.TenantContext;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Talks to dispatch-service, which owns delivery credentials and message sending.
 *
 * <p>dispatch-service is deployed independently and is not considered part of
 * the ingest hot path.
 */
@Component
public class DispatchClient {

    private static final String SERVICE_NAME = "dispatch-service";

    private final RestClient restClient;

    public DispatchClient(RestClient dispatchRestClient) {
        this.restClient = dispatchRestClient;
    }

    /**
     * Asks dispatch-service whether it can deliver to this target.
     */
    public VerifyTargetResponse verifyTarget(ChannelType type, String targetRef) {
        try {
            return restClient.post()
                    .uri("/internal/v1/targets/verify")
                    .header("X-Org-Id", TenantContext.requireOrgId())
                    .body(new VerifyTargetRequest(type.name(), targetRef))
                    .retrieve()
                    .body(VerifyTargetResponse.class);
        } catch (RestClientException ex) {
            throw new UpstreamUnavailableException(SERVICE_NAME, "verifyTarget failed", ex);
        }
    }

    /**
     * Sends a one-off test message so an operator can confirm a channel works.
     */
    public TestMessageResponse sendTestMessage(String targetRef, String subject, String body) {
        try {
            return restClient.post()
                    .uri("/internal/v1/messages/test")
                    .header("X-Org-Id", TenantContext.requireOrgId())
                    .body(new TestMessageRequest(targetRef, subject, body))
                    .retrieve()
                    .body(TestMessageResponse.class);
        } catch (RestClientException ex) {
            throw new UpstreamUnavailableException(SERVICE_NAME, "sendTestMessage failed", ex);
        }
    }
}
