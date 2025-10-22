package com.voidmuse.idea.plugin.domain;

/**
 * @author zhangdaguan
 */
public class EditCodeContext {

    private String type;
    private String name;
    private String context;
    private Integer id;

    public EditCodeContext() {
    }

    public EditCodeContext(String type, String name, String context) {
        this.type = type;
        this.name = name;
        this.context = context;
    }

    public EditCodeContext(String type, String name, Integer id) {
        this.type = type;
        this.name = name;
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }

}
