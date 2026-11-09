package com.racesync.controller;

import com.racesync.model.Role;
import com.racesync.model.User;
import com.racesync.repository.UserRepository;
import com.racesync.security.JwtTokenProvider;
import com.racesync.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller responsável por toda a autenticação do sistema (Registro, Login e Perfil do Usuário atual).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * Rota de login (/api/auth/login) - Método POST.
     * Recebe um payload de login com e-mail e senha, autentica o usuário e gera um token JWT de acesso.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail().trim(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", userPrincipal.getUser());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Email ou senha incorretos.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    /**
     * Rota de cadastro (/api/auth/register) - Método POST.
     * Cadastra um novo usuário no sistema com criptografia de senha e validação de chaves únicas.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        Map<String, String> errorResponse = new HashMap<>();

        String email = signUpRequest.getEmail().trim().toLowerCase();
        String cpf = signUpRequest.getCpf().replaceAll("\\D", "");

        if (userRepository.existsByEmail(email)) {
            errorResponse.put("error", "Email já cadastrado.");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        if (userRepository.existsByCpf(cpf)) {
            errorResponse.put("error", "CPF já cadastrado.");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        Role role;
        try {
            role = Role.valueOf(signUpRequest.getRole().trim().toUpperCase());
        } catch (Exception e) {
            role = Role.PILOT_SPECTATOR;
        }

        // Restringe perfis administrativos (MANAGER e ORGANIZER)
        if (role != Role.PILOT_SPECTATOR) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Role callerRole = (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal)
                    ? ((UserPrincipal) auth.getPrincipal()).getUser().getRole() : null;

            boolean isAuthorizedStaff = (callerRole == Role.MANAGER) || (callerRole == Role.ORGANIZER && role == Role.ORGANIZER);
            if (!isAuthorizedStaff) {
                errorResponse.put("error", "Apenas administradores podem cadastrar contas com perfis administrativos.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }
        }

        User user = User.builder()
                .name(signUpRequest.getName().trim())
                .email(email)
                .cpf(cpf)
                .password(passwordEncoder.encode(signUpRequest.getPassword()))
                .role(role)
                .build();

        User result = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Rota para recuperar dados do usuário autenticado atual (/api/auth/me) - Método GET.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Usuário não autenticado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
        return ResponseEntity.ok(userPrincipal.getUser());
    }

    // --- PAYLOADS / DTOs (Data Transfer Objects) ---

    @Data
    public static class LoginRequest {
        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Forneça um endereço de e-mail válido.")
        private String email;

        @NotBlank(message = "A senha é obrigatória.")
        private String password;
    }

    @Data
    public static class SignUpRequest {
        @NotBlank(message = "O nome é obrigatório.")
        private String name;

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Forneça um endereço de e-mail válido.")
        private String email;

        @NotBlank(message = "A senha é obrigatória.")
        private String password;

        @NotBlank(message = "O CPF é obrigatório.")
        private String cpf;

        @NotBlank(message = "O perfil (role) é obrigatório.")
        private String role;
    }
}
