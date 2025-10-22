package com.voidmuse.idea.plugin.service;


import com.intellij.openapi.components.Service;
import com.intellij.openapi.project.Project;
import com.intellij.ui.jcef.JBCefBrowser;

import java.util.HashMap;
import java.util.Map;

@Service(Service.Level.PROJECT)
public final class ProjectBeanService {

    public static final String BROWSER_BEAN = "BROWSER_BEAN";

    private final Project project;

    private Map<String, Object> beans = new HashMap<>();

    public ProjectBeanService(Project project) {
        this.project = project;
    }

    public JBCefBrowser getBrowser() {
        return (JBCefBrowser) beans.get(BROWSER_BEAN);
    }

    public void setBrowser(JBCefBrowser browser) {
        beans.put(BROWSER_BEAN, browser);
    }

    public static ProjectBeanService getInstance(Project project) {
        return project.getService(ProjectBeanService.class);
    }


}
