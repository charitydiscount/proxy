package com.charitydiscount.affiliate.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.io.Serializable;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdvertiserPromotion implements Serializable {
  @Getter(onMethod_ = {@JsonProperty(value = "id", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "id", access = JsonProperty.Access.WRITE_ONLY)})
  private Integer id;

  @Getter(onMethod_ = {@JsonProperty(value = "name", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "name", access = JsonProperty.Access.WRITE_ONLY)})
  private String name;

  @Getter(onMethod_ = {@JsonProperty(value = "promotionStart", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "promotion_start", access = JsonProperty.Access.WRITE_ONLY)})
  private String promotionStart;

  @Getter(onMethod_ = {@JsonProperty(value = "promotionEnd", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "promotion_end", access = JsonProperty.Access.WRITE_ONLY)})
  private String promotionEnd;

  @Getter(onMethod_ = {@JsonProperty(value = "landingPageLink", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "landing_page_link", access = JsonProperty.Access.WRITE_ONLY)})
  private String landingPageLink;

  @Getter(onMethod_ = {@JsonProperty(value = "banners", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "banners", access = JsonProperty.Access.WRITE_ONLY)})
  private Boolean banners;

  @Getter(onMethod_ = {@JsonProperty(value = "status", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "status", access = JsonProperty.Access.WRITE_ONLY)})
  private String status;

  @Getter(onMethod_ = {@JsonProperty(value = "campaignId", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "campaign_id", access = JsonProperty.Access.WRITE_ONLY)})
  private Integer campaignId;

  @Getter(onMethod_ = {@JsonProperty(value = "campaignLogo", access = JsonProperty.Access.READ_ONLY)})
  @Setter(onMethod_ = {@JsonProperty(value = "campaign_logo", access = JsonProperty.Access.WRITE_ONLY)})
  private String campaignLogo;

  @Getter(onMethod_ = {@JsonProperty(value = "programId", access = JsonProperty.Access.READ_ONLY)})
  private Integer programId;

  @Getter(onMethod_ = {@JsonProperty(value = "source", access = JsonProperty.Access.READ_ONLY)})
  @Setter
  private String source;

  @JsonProperty(value = "program", access = JsonProperty.Access.WRITE_ONLY)
  public void programIdFromProgram(Program program) {
    setProgramId(program.id);
  }
}