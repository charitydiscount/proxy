package com.charitydiscount.affiliate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;

@SpringBootApplication
public class AffiliateApplication {
    public static void main(String[] args) {
        SpringApplication.run(AffiliateApplication.class, args);
    }
}

@Component
class ProductServiceInterceptorAppConfig extends WebMvcConfigurationSupport {
    @Autowired
    private AffiliateInterceptor productServiceInterceptor;

    @Override
    protected void addCorsMappings(CorsRegistry registry) {
        registry
            .addMapping("/**")
            .allowedOrigins(
                "http://localhost:3000",
                "https://charitydiscount.ro",
                "https://charitydiscount.github.io");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(productServiceInterceptor);
    }
}

