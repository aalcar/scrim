package com.pulse.api.web;

/**
 * Holds the organisation id for the current request.
 *
 * <p>Populated by {@link TenantFilter} and cleared when the request completes.
 * Services read the org id from here instead of threading it through every
 * method signature.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_ORG = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setOrgId(String orgId) {
        CURRENT_ORG.set(orgId);
    }

    /**
     * @return the org id bound to the current request
     * @throws IllegalStateException if called outside a tenant-scoped request
     */
    public static String requireOrgId() {
        String orgId = CURRENT_ORG.get();
        if (orgId == null) {
            throw new IllegalStateException("No org id bound to the current request");
        }
        return orgId;
    }

    public static void clear() {
        CURRENT_ORG.remove();
    }
}
