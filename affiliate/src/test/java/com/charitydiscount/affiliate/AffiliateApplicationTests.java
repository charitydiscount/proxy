package com.charitydiscount.affiliate;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import static org.junit.Assert.assertNotNull;

@RunWith(SpringRunner.class)
@SpringBootTest
public class AffiliateApplicationTests {
  @Autowired
  private TwoPerformantService twoPerformantService;

  @Test
  public void contextLoads() {
  }

  @Test
  public void canGetAuthHeaders() {
    assertNotNull(twoPerformantService.getAuthHeaders());
  }

}
