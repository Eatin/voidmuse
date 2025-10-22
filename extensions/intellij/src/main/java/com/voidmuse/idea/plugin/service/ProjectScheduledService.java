package com.voidmuse.idea.plugin.service;

import com.intellij.openapi.components.Service;
import com.intellij.openapi.project.Project;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * @author zhangdaguan
 */
@Service(Service.Level.PROJECT)
public final class ProjectScheduledService {
    private final Project project;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(3);

    public ProjectScheduledService(Project project) {
        this.project = project;
    }

    public static ProjectScheduledService getInstance(Project project) {
        return project.getService(ProjectScheduledService.class);
    }

    public void scheduleAtFixedRate(Runnable command,
                                    long initialDelay,
                                    long period,
                                    TimeUnit unit) {
        this.scheduler.scheduleAtFixedRate(command, initialDelay, period, unit);

    }
}
