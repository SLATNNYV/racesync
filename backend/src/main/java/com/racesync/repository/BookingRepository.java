package com.racesync.repository;

import com.racesync.model.TrackBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<TrackBooking, Long> {
    List<TrackBooking> findByPilotId(Long pilotId);
    Optional<TrackBooking> findByQrCodeToken(String qrCodeToken);
}
