package com.racesync.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String date; // E.g., "15/10/2026"

    @Column(nullable = false)
    private BigDecimal registrationFee;

    @Column(nullable = false)
    private Integer boxSlotsTotal;

    @Column(nullable = false)
    private Integer boxSlotsRemaining;

    @Column(nullable = false)
    private String status; // "PATROCINADO", "CONFIRMADO", etc.
}
