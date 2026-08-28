# pulse-api

Metrics ingest, query, and notification channel service.

`pulse-api` is the control plane and read path for the metrics pipeline. Agents
running on customer hosts POST batches of datapoints to the ingest endpoint;
the web console reads them back through the query endpoint. The service also
owns **notification channels** — the destinations (Slack, PagerDuty, webhook)
that the platform delivers messages to.

## Architecture

```
  agents ──POST /v1/ingest/metrics──▶ ┌────────────┐
                                      │            │
  console ──GET /v1/metrics/query───▶ │ pulse-api  │──▶ dispatch-service
                                      │            │      (delivery)
  console ──/v1/channels ───────────▶ └────────────┘
                                            │
                                            ▼
                                        postgres
```

`dispatch-service` is a separate internal service that owns actual message
delivery, retries, and provider credentials. `pulse-api` calls it over HTTP to
validate and test channel configuration. It is not on the ingest hot path.

## Layout

| Path | Contents |
|---|---|
| `controller/` | HTTP layer. Thin — validation and DTO mapping only. |
| `service/` | Business logic. Owns transactions. |
| `repository/` | Spring Data JPA repositories. |
| `model/` | JPA entities. Never returned from controllers. |
| `dto/` | Request and response bodies. |
| `client/` | Outbound HTTP clients for other internal services. |
| `web/` | Filters and request-scoped context. |
| `exception/` | Exception types and the global handler. |
| `config/` | `@Configuration` beans. |

## Conventions

- Every request carries `X-Org-Id`. `TenantFilter` extracts it into
  `TenantContext`; services read it from there rather than taking it as a
  parameter. Requests without the header are rejected with `401`.
- All errors go through `GlobalExceptionHandler` and are serialised as
  `ApiErrorResponse`. Do not write error bodies by hand in a controller.
- Public IDs are prefixed ULIDs (`ch_01J8Z...`). The numeric primary key never
  leaves the service.
- Timestamps are epoch milliseconds (UTC) on the wire.

## Running

```
./mvnw spring-boot:run
```

H2 in-memory by default. Postgres in every deployed environment.
