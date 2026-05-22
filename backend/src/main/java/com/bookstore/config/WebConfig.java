package com.bookstore.config;

import com.bookstore.security.CurrentUserArgumentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

import org.springframework.context.annotation.Lazy;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CorsConfigurationSource corsConfigurationSource;
    private final CurrentUserArgumentResolver currentUserArgumentResolver;
    private final GuestSessionInterceptor guestSessionInterceptor;

    public WebConfig(@Lazy CorsConfigurationSource corsConfigurationSource,
                     @Lazy CurrentUserArgumentResolver currentUserArgumentResolver,
                     GuestSessionInterceptor guestSessionInterceptor) {
        this.corsConfigurationSource = corsConfigurationSource;
        this.currentUserArgumentResolver = currentUserArgumentResolver;
        this.guestSessionInterceptor = guestSessionInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserArgumentResolver);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(guestSessionInterceptor)
                .addPathPatterns("/api/**");
    }
}
