package com.charitydiscount.affiliate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;
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
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(productServiceInterceptor);
  }
}

