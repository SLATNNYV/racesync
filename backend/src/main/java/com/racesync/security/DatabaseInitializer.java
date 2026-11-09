package com.racesync.security;

import com.racesync.model.Event;
import com.racesync.model.Role;
import com.racesync.model.User;
import com.racesync.repository.EventRepository;
import com.racesync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .name("Administrador Principal")
                    .email("vinnyrace@racesync.com")
                    .cpf("10671874993")
                    .password(passwordEncoder.encode("123456"))
                    .role(Role.MANAGER)
                    .build();

            userRepository.save(admin);
            log.info(">>> RaceSync: Default manager account created (vinnyrace@racesync.com / 123456) <<<");
        }

        if (eventRepository.count() == 0) {
            Event defaultEvent = Event.builder()
                    .name("FESTIVAL DE ARRANCADA 201M")
                    .city("Maringá / PR")
                    .date("15/10/2026")
                    .registrationFee(new BigDecimal("300.00"))
                    .boxSlotsTotal(40)
                    .boxSlotsRemaining(40)
                    .status("PATROCINADO")
                    .build();

            eventRepository.save(defaultEvent);
            log.info(">>> RaceSync: Default event created ('FESTIVAL DE ARRANCADA 201M') <<<");
        }
    }
}
