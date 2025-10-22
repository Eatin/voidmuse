package com.voidmuse.idea.plugin.common;

public class AlarmInfo {

    private String alarmTime;

    private String causeType;

    private String alarmText;

    private String rootCause;

    private String appName;

    private String handlerDw;

    private String alarmClass;

    private String alarmMethod;

    public String getAlarmTime() {
        return alarmTime;
    }

    public void setAlarmTime(String alarmTime) {
        this.alarmTime = alarmTime;
    }

    public String getCauseType() {
        return causeType;
    }

    public void setCauseType(String causeType) {
        this.causeType = causeType;
    }

    public String getAlarmText() {
        return alarmText;
    }

    public void setAlarmText(String alarmText) {
        this.alarmText = alarmText;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String rootCause) {
        this.rootCause = rootCause;
    }

    public String getAppName() {
        return appName;
    }

    public void setAppName(String appName) {
        this.appName = appName;
    }

    public String getHandlerDw() {
        return handlerDw;
    }

    public void setHandlerDw(String handlerDw) {
        this.handlerDw = handlerDw;
    }

    public String getAlarmMethod() {
        return alarmMethod;
    }

    public void setAlarmMethod(String alarmMethod) {
        this.alarmMethod = alarmMethod;
    }

    public String getAlarmClass() {
        return alarmClass;
    }

    public void setAlarmClass(String alarmClass) {
        this.alarmClass = alarmClass;
    }

    @Override
    public String toString() {
        return "AlarmInfo{" +
                "alarmTime='" + alarmTime + '\'' +
                ", causeType='" + causeType + '\'' +
                ", alarmText='" + alarmText + '\'' +
                ", rootCause='" + rootCause + '\'' +
                ", appName='" + appName + '\'' +
                ", handlerDw='" + handlerDw + '\'' +
                ", alarmClass='" + alarmClass + '\'' +
                ", alarmMethod='" + alarmMethod + '\'' +
                '}';
    }
}
