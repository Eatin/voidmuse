package com.voidmuse.idea.plugin.editor;


import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * @author zhangdaguan
 */
public class Debouncer {
    private final long interval;
    private final ScheduledExecutorService scheduler;
    private ScheduledFuture<?> debounceFuture;

    public Debouncer(long interval) {
        this.interval = interval;
        this.scheduler = Executors.newSingleThreadScheduledExecutor();
    }

    public void debounce(Runnable action) {
        if (debounceFuture != null && !debounceFuture.isDone()) {
            debounceFuture.cancel(false);
        }
        debounceFuture = scheduler.schedule(action, interval, TimeUnit.MILLISECONDS);
    }

    public void shutdown() {
        scheduler.shutdown();
    }
}
