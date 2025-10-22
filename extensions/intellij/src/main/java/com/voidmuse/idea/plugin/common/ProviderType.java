package com.voidmuse.idea.plugin.common;

public enum ProviderType {
  OPENAI("openAI"),
  DEEPSEEK("deepSeek"),
  ZHIPU("zhipu"),
  ;

  private final String code;


  ProviderType(String code) {
    this.code = code;
  }

  public String getCode() {
    return code;
  }
}
