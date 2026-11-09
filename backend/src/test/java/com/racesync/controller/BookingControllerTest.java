package com.racesync.controller;

import com.racesync.model.*;
import com.racesync.repository.BookingRepository;
import com.racesync.repository.EventRepository;
import com.racesync.repository.VehicleRepository;
import com.racesync.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private BookingController bookingController;

    private User pilot;
    private UserPrincipal pilotPrincipal;
    private Event event;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        pilot = User.builder().id(1L).name("Piloto Ayrton").email("ayrton@racesync.com").role(Role.PILOT_SPECTATOR).build();
        pilotPrincipal = new UserPrincipal(pilot);

        event = Event.builder()
                .id(100L)
                .name("Arrancada Maringá 2026")
                .city("Maringá")
                .date("15/10/2026")
                .registrationFee(new BigDecimal("300.00"))
                .boxSlotsTotal(10)
                .boxSlotsRemaining(10)
                .status("CONFIRMADO")
                .build();

        vehicle = Vehicle.builder()
                .id(50L)
                .name("Chevette TT")
                .number("88")
                .category("Carros Turbo")
                .owner(pilot)
                .inspectionStatus(InspectionStatus.APPROVED)
                .build();
    }

    @Test
    void testCreateBooking_Success_WithBox() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(event));
        when(vehicleRepository.findById(50L)).thenReturn(Optional.of(vehicle));
        when(bookingRepository.save(any(TrackBooking.class))).thenAnswer(i -> i.getArgument(0));

        BookingController.BookingRequest req = new BookingController.BookingRequest();
        req.setEventId(100L);
        req.setVehicleId(50L);
        req.setTimeSlot("Shark Tank");
        req.setBookBox(true);

        ResponseEntity<?> response = bookingController.createBooking(pilotPrincipal, req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        TrackBooking saved = (TrackBooking) response.getBody();
        assertNotNull(saved);
        assertEquals("CONFIRMED", saved.getStatus());
        assertNotNull(saved.getQrCodeToken());
        assertEquals(9, event.getBoxSlotsRemaining()); // Decremented box slot
        verify(eventRepository, times(1)).save(event);
    }

    @Test
    void testCreateBooking_Forbidden_WhenNotOwner() {
        User otherUser = User.builder().id(2L).name("Outro Piloto").role(Role.PILOT_SPECTATOR).build();
        vehicle.setOwner(otherUser);

        when(eventRepository.findById(100L)).thenReturn(Optional.of(event));
        when(vehicleRepository.findById(50L)).thenReturn(Optional.of(vehicle));

        BookingController.BookingRequest req = new BookingController.BookingRequest();
        req.setEventId(100L);
        req.setVehicleId(50L);
        req.setTimeSlot("Shark Tank");
        req.setBookBox(false);

        ResponseEntity<?> response = bookingController.createBooking(pilotPrincipal, req);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertTrue(body.get("error").contains("sua própria garagem"));
    }

    @Test
    void testScanCheckIn_Success_WhenVehicleApproved() {
        TrackBooking booking = TrackBooking.builder()
                .id(1L)
                .event(event)
                .pilot(pilot)
                .vehicle(vehicle)
                .timeSlot("Shark Tank")
                .status("CONFIRMED")
                .qrCodeToken("token-valido-123")
                .build();

        when(bookingRepository.findByQrCodeToken("token-valido-123")).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(TrackBooking.class))).thenAnswer(i -> i.getArgument(0));

        BookingController.CheckInRequest req = new BookingController.CheckInRequest();
        req.setQrCodeToken("token-valido-123");

        ResponseEntity<?> response = bookingController.scanCheckIn(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        TrackBooking checked = (TrackBooking) response.getBody();
        assertEquals("CHECKED_IN", checked.getStatus());
    }

    @Test
    void testScanCheckIn_Forbidden_WhenVehicleNotApproved() {
        vehicle.setInspectionStatus(InspectionStatus.PENDING);
        TrackBooking booking = TrackBooking.builder()
                .id(1L)
                .event(event)
                .pilot(pilot)
                .vehicle(vehicle)
                .timeSlot("Shark Tank")
                .status("CONFIRMED")
                .qrCodeToken("token-pendente-123")
                .build();

        when(bookingRepository.findByQrCodeToken("token-pendente-123")).thenReturn(Optional.of(booking));

        BookingController.CheckInRequest req = new BookingController.CheckInRequest();
        req.setQrCodeToken("token-pendente-123");

        ResponseEntity<?> response = bookingController.scanCheckIn(req);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertTrue(body.get("error").contains("não foi aprovado na vistoria"));
    }

    @Test
    void testScanCheckIn_BadRequest_WhenAlreadyCheckedIn() {
        TrackBooking booking = TrackBooking.builder()
                .id(1L)
                .event(event)
                .pilot(pilot)
                .vehicle(vehicle)
                .timeSlot("Shark Tank")
                .status("CHECKED_IN")
                .qrCodeToken("token-ja-usado")
                .build();

        when(bookingRepository.findByQrCodeToken("token-ja-usado")).thenReturn(Optional.of(booking));

        BookingController.CheckInRequest req = new BookingController.CheckInRequest();
        req.setQrCodeToken("token-ja-usado");

        ResponseEntity<?> response = bookingController.scanCheckIn(req);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertTrue(body.get("error").contains("já foi utilizada"));
    }
}

