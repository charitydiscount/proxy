package com.charitydiscount.affiliate.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
    "results",
    "pages",
    "current_page"
})
public class Pagination {
  @JsonProperty("results")
  public Integer results;
  @JsonProperty("pages")
  public Integer pages;
  @JsonProperty("current_page")
  public Integer currentPage;
}
