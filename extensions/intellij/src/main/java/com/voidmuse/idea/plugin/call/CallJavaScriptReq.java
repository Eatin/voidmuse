package com.voidmuse.idea.plugin.call;

import java.util.Map;

public class CallJavaScriptReq {

    private String methodName;

    private Map<String, Object> arg;

    public CallJavaScriptReq() {
    }

    public CallJavaScriptReq(String methodName, Map<String, Object> arg) {
        this.methodName = methodName;
        this.arg = arg;
    }

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    public Map<String, Object> getArg() {
        return arg;
    }

    public void setArg(Map<String, Object> arg) {
        this.arg = arg;
    }

    @Override
    public String toString() {
        return "CallJavaScriptReq{" +
                "methodName='" + methodName + '\'' +
                ", arg=" + arg +
                '}';
    }
}
