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
 * A anotação @RestController indica que esta classe é um controlador REST que retorna objetos serializados (geralmente JSON).
 * A anotação @RequestMapping define o caminho base ("/api/auth") para todas as rotas desta classe.
 * A anotação @RequiredArgsConstructor gera automaticamente um construtor com os argumentos obrigatórios (campos marcados como final).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // Gerenciador de autenticação nativo do Spring Security
    private final AuthenticationManager authenticationManager;
    
    // Repositório para interagir com a tabela de usuários no banco de dados
    private final UserRepository userRepository;
    
    // Codificador usado para criptografar as senhas dos usuários (BCrypt)
    private final PasswordEncoder passwordEncoder;
    
    // Provedor de tokens responsável por gerar e ler os tokens JWT
    private final JwtTokenProvider tokenProvider;

    /**
     * Rota de login (/api/auth/login) - Método POST.
     * Recebe um payload de login com e-mail e senha, autentica o usuário e gera um token JWT de acesso.
     * 
     * @param loginRequest Objeto mapeado contendo e-mail e senha recebidos no corpo da requisição
     * @return Retorna o token JWT e os dados do usuário logado se as credenciais forem válidas
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Tenta autenticar o e-mail e a senha no provedor do Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            // Se for bem sucedido, define a autenticação no contexto atual do Spring Security
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Gera um token JWT com base nos dados autenticados
            String jwt = tokenProvider.generateToken(authentication);
            
            // Obtém os dados do usuário que acabaram de ser validados
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Monta o mapa de resposta contendo o token de acesso e os dados públicos do usuário
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", userPrincipal.getUser());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Se as credenciais estiverem incorretas, retorna código HTTP 401 (Unauthorized)
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Email ou senha incorretos.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    /**
     * Rota de cadastro (/api/auth/register) - Método POST.
     * Cadastra um novo usuário no sistema com criptografia de senha e validação de chaves únicas.
     * 
     * @param signUpRequest Objeto mapeado contendo nome, e-mail, senha, CPF e o perfil do usuário
     * @return Retorna o usuário criado com código HTTP 201 (Created) ou erro correspondente
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        Map<String, String> errorResponse = new HashMap<>();

        // Valida se o e-mail já existe no banco
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            errorResponse.put("error", "Email já cadastrado.");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Valida se o CPF já existe no banco
        if (userRepository.existsByCpf(signUpRequest.getCpf())) {
            errorResponse.put("error", "CPF já cadastrado.");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Tenta obter a role informada no cadastro, senão define o valor padrão PILOT_SPECTATOR
        Role role;
        try {
            role = Role.valueOf(signUpRequest.getRole().toUpperCase());
        } catch (Exception e) {
            role = Role.PILOT_SPECTATOR;
        }

        // Restrict non-PILOT_SPECTATOR profiles to MANAGER users only
        if (role != Role.PILOT_SPECTATOR) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isUserManager = auth != null && auth.isAuthenticated() 
                    && auth.getPrincipal() instanceof UserPrincipal 
                    && ((UserPrincipal) auth.getPrincipal()).getUser().getRole() == Role.MANAGER;
            
            if (!isUserManager) {
                errorResponse.put("error", "Apenas administradores podem cadastrar contas com perfis administrativos.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }
        }

        // Constrói o novo usuário criptografando a senha recebida
        User user = User.builder()
                .name(signUpRequest.getName())
                .email(signUpRequest.getEmail())
                .cpf(signUpRequest.getCpf())
                .password(passwordEncoder.encode(signUpRequest.getPassword()))
                .role(role)
                .build();

        // Salva o usuário no banco de dados H2
        User result = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Rota para recuperar dados do usuário autenticado atual (/api/auth/me) - Método GET.
     * A anotação @AuthenticationPrincipal extrai automaticamente o principal autenticado atual da sessão do Spring Security.
     * 
     * @param userPrincipal Detalhes da sessão do usuário autenticado atual
     * @return Retorna os dados do usuário autenticado ou erro 401 caso não esteja logado
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }
        return ResponseEntity.ok(userPrincipal.getUser());
    }

    // --- PAYLOADS / DTOs (Data Transfer Objects) usados para validação de requisições ---

    /**
     * DTO contendo as informações enviadas na requisição de login.
     * A anotação @Data do Lombok gera getters, setters, toString e hashCode automaticamente.
     */
    @Data
    public static class LoginRequest {
        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Forneça um endereço de e-mail válido.")
        private String email;

        @NotBlank(message = "A senha é obrigatória.")
        private String password;
    }

    /**
     * DTO contendo as informações enviadas na requisição de cadastro.
     */
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
        private String role; // "ORGANIZER", "MANAGER", "PILOT_SPECTATOR"
    }
}
