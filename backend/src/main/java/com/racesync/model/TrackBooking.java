package com.racesync.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "track_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pilot_id", nullable = false)
    private User pilot;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private String timeSlot; // E.g., "09:00 - 10:00"

    @Column(nullable = false, unique = true)
    private String qrCodeToken; // UUID string used for check-in QR code

    @Column(nullable = false)
    private String status; // "CONFIRMED", "PENDING", etc.
}
