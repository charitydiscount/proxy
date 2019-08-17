package com.charitydiscount.affiliate;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@RunWith(MockitoJUnitRunner.class)
public class TwoPerformantServiceTest {
  @Mock
  private RestTemplate restTemplate;

  @Mock
  private Environment environment;

  private TwoPerformantService twoPerformantService;

  @Before
  public void setUp() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
    headers.set("User-Agent", "PostmanRuntime/7.13.0");

    JSONObject credentials = new JSONObject();
    JSONObject userCredentials = new JSONObject();
    try {
      credentials.put("email", "test@test.com");
      credentials.put("password", "password");
      userCredentials.put("user", credentials);
    } catch (JSONException e) {
      e.printStackTrace();
      Assert.fail("Failed to set the mock headers");
    }

    HttpEntity<String> request = new HttpEntity<>(userCredentials.toString(), headers);

    HttpHeaders mockedResponseHeaders = new HttpHeaders();
    mockedResponseHeaders.set("access-token", "token");
    mockedResponseHeaders.set("client", "client");
    mockedResponseHeaders.set("uid", "uid");
    mockedResponseHeaders.set("token-type", "type");

    //noinspection unchecked
    Mockito
        .when(restTemplate.exchange("https://api.2performant.com/users/sign_in", HttpMethod.POST, request,
            String.class))
        .thenReturn(new ResponseEntity(mockedResponseHeaders, HttpStatus.OK));

    Mockito.when(environment.getProperty("TWOP_EMAIL")).thenReturn("test@test.com");
    Mockito.when(environment.getProperty("TWOP_PASS")).thenReturn("password");

    twoPerformantService = new TwoPerformantService(restTemplate, environment);
  }

  @Test
  public void getAuthHeaders() {
    HttpHeaders actualHeaders = twoPerformantService.getAuthHeaders();

    HttpHeaders expectedHeaders = new HttpHeaders();

    expectedHeaders.set("access-token", "token");
    expectedHeaders.set("client", "client");
    expectedHeaders.set("uid", "uid");
    expectedHeaders.set("token-type", "type");
    expectedHeaders.setContentType(MediaType.APPLICATION_JSON);
    expectedHeaders.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
    expectedHeaders.set("User-Agent", "PostmanRuntime/7.13.0");

    Assert.assertEquals(expectedHeaders, actualHeaders);
  }

  @Test
  public void getPromotions() {
  }
}