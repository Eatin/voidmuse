package com.voidmuse.idea.plugin.domain;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class DataState {

    public static final String PREFIX = "VoidMuseDataState";

    private Map<String, String> map = new ConcurrentHashMap<>();

    public Map<String, String> getMap() {
        return map;
    }

    public void setMap(Map<String, String> map) {
        this.map = map;
    }

    public void putData(String key, String value) {
        map.put(getKey(key), value);
    }

    public String getData(String key) {
        return map.get(getKey(key));
    }

    private String getKey(String key) {
        return PREFIX + ":" + key;
    }

}
