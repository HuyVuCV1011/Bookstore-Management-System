package com.bookstore.config;

import com.bookstore.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // Public POST/auth endpoints
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/refresh"
                        ).permitAll()
                        // Public GET/read endpoints
                        .requestMatchers(HttpMethod.GET,
                                "/actuator/health",
                                // Catalog: public GET endpoints
                                "/api/books",
                                "/api/books/**",
                                "/api/categories",
                                "/api/categories/**",
                                "/api/authors",
                                "/api/authors/**",
                                "/api/publishers",
                                "/api/publishers/**",
                                // Search: public endpoints
                                "/api/search/**",
                                "/api/redis-search/**",
                                // Graph: public endpoints
                                "/api/graph/recommendations/**",
                                "/api/graph/books/**",
                                // Reviews: public read endpoints
                                "/api/reviews/book/**",
                                "/api/reviews/test/**"
                        ).permitAll()
                        // Public POST endpoints
                        .requestMatchers(HttpMethod.POST,
                                "/api/graph/interactions/view",
                                "/api/reviews/summaries"
                        ).permitAll()
                        // Cart: supports both authenticated and guest users
                        .requestMatchers(
                                "/api/cart",
                                "/api/cart/**"
                        ).permitAll()
                        // Catalog mutating operations at URL layer
                        .requestMatchers(HttpMethod.POST, "/api/books", "/api/books/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PUT, "/api/books", "/api/books/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.DELETE, "/api/books", "/api/books/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/categories", "/api/categories/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PUT, "/api/categories", "/api/categories/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories", "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/authors", "/api/authors/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PUT, "/api/authors", "/api/authors/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.DELETE, "/api/authors", "/api/authors/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/publishers", "/api/publishers/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PUT, "/api/publishers", "/api/publishers/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.DELETE, "/api/publishers", "/api/publishers/**").hasRole("ADMIN")
                        // Admin endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Graph analytics & sync: require auth (method-level @PreAuthorize handles roles)
                        .requestMatchers("/api/graph/**").authenticated()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
