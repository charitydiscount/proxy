package com.charitydiscount.affiliate.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.*;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
    "pagination",
    "advertiser_promotions",
})
public class PromotionsResponse {
  @JsonProperty("pagination")
  public Pagination pagination;
  @JsonProperty("advertiser_promotions")
  public List<AdvertiserPromotion> advertiserPromotions = null;
}