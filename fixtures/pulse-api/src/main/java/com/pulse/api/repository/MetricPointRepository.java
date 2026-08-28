package com.pulse.api.repository;

import com.pulse.api.model.MetricPoint;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MetricPointRepository extends JpaRepository<MetricPoint, Long> {

    @Query("""
            select p from MetricPoint p
            where p.orgId = :orgId
              and p.metricName = :metricName
              and p.timestampMs >= :fromMs
              and p.timestampMs < :toMs
            order by p.timestampMs asc
            """)
    List<MetricPoint> findRange(@Param("orgId") String orgId,
                                @Param("metricName") String metricName,
                                @Param("fromMs") long fromMs,
                                @Param("toMs") long toMs,
                                Pageable pageable);

    @Query("""
            select distinct p.tagSet from MetricPoint p
            where p.orgId = :orgId and p.metricName = :metricName
            """)
    List<String> findTagSets(@Param("orgId") String orgId, @Param("metricName") String metricName);
}
