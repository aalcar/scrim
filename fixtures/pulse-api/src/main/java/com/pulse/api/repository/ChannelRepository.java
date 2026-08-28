package com.pulse.api.repository;

import com.pulse.api.model.Channel;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChannelRepository extends JpaRepository<Channel, Long> {

    Optional<Channel> findByOrgIdAndPublicId(String orgId, String publicId);

    boolean existsByOrgIdAndName(String orgId, String name);

    long countByOrgId(String orgId);

    @Query("select c from Channel c where c.orgId = :orgId order by c.createdAt desc, c.id desc")
    List<Channel> findPage(@Param("orgId") String orgId, Pageable pageable);

    List<Channel> findByOrgIdAndPublicIdIn(String orgId, List<String> publicIds);
}
