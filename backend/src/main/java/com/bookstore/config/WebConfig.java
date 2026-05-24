package com.bookstore.config;

import com.bookstore.security.CurrentUserArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

import org.springframework.context.annotation.Lazy;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CurrentUserArgumentResolver currentUserArgumentResolver;
    private final GuestSessionInterceptor guestSessionInterceptor;

    public WebConfig(@Lazy CurrentUserArgumentResolver currentUserArgumentResolver,
                     GuestSessionInterceptor guestSessionInterceptor) {
        this.currentUserArgumentResolver = currentUserArgumentResolver;
        this.guestSessionInterceptor = guestSessionInterceptor;
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
