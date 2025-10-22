package com.voidmuse.idea.plugin.call;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.Map;
@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class CallJavaReq {
    private String methodName;
    private String requestId;
    private Map<String, Object> arg;
}
