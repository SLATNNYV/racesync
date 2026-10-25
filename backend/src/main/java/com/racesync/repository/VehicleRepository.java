package com.racesync.repository;

import com.racesync.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByOwnerId(Long ownerId);


    @Query(value = "SELECT * FROM vehicles WHERE owner_id = :ownerId",
            nativeQuery = true)
    List<Vehicle> buscarPorProprietario(@Param("ownerId") Long ownerId);

}

