package com.pulse.api.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Binds the {@code X-Org-Id} request header to {@link TenantContext}.
 *
 * <p>Actuator endpoints are unauthenticated and are skipped.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class TenantFilter extends OncePerRequestFilter {

    static final String ORG_HEADER = "X-Org-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String orgId = request.getHeader(ORG_HEADER);
        if (!StringUtils.hasText(orgId)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing " + ORG_HEADER);
            return;
        }
        try {
            TenantContext.setOrgId(orgId);
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/actuator");
    }
}
