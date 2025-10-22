package com.voidmuse.idea.plugin.service;

import cn.hutool.json.JSONUtil;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.intellij.ui.jcef.JBCefBrowser;
import com.voidmuse.idea.plugin.call.CallJavaReq;
import com.voidmuse.idea.plugin.call.CallJavaScriptReq;
import org.apache.commons.lang3.StringUtils;

import javax.swing.*;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.DelayQueue;
import java.util.concurrent.Delayed;
import java.util.concurrent.TimeUnit;

/**
 * @author zhangdaguan
 */
@Service(Service.Level.PROJECT)
public final class CallJavaScriptService {
    private static final Logger LOG = Logger.getInstance(CallJavaScriptService.class);

    public interface Callback {
        void run(Map<String, Object> args);

        default void timeout() {
        }
    }


    private final Project project;
    private final ConcurrentHashMap<String, Callback> callbacks = new ConcurrentHashMap<>();
    private final DelayQueue<DelayedTask> delayQueue = new DelayQueue<>();

    public CallJavaScriptService(Project project) {
        this.project = project;
        startCallbackCleaner();
    }

    public static CallJavaScriptService getInstance(Project project) {
        return project.getService(CallJavaScriptService.class);
    }

    public void callJavaScriptAsync(String methodName, Map<String, Object> args, Callback callback) {
        JBCefBrowser browser = ProjectBeanService.getInstance(project).getBrowser();
        if (browser == null) {
            throw new RuntimeException("browser is null");
        }
        //添加唯一id
        String requestId = UUID.randomUUID().toString();
        args.put("requestId", requestId);
        CallJavaScriptReq callJavaScriptReq = new CallJavaScriptReq(methodName, args);
        // Store the callback and set a timeout
        callbacks.put(requestId, callback);
        browser.getCefBrowser().executeJavaScript("callJavaScript('" + JSONUtil.toJsonStr(callJavaScriptReq) + "')", null, 0);

        delayQueue.offer(new DelayedTask(requestId, 30, TimeUnit.SECONDS));
    }

    public void callJavaScript(Project project, String methodName, Map<String, Object> arg) {
        JBCefBrowser browser = ProjectBeanService.getInstance(project).getBrowser();
        SwingUtilities.invokeLater(() -> {
            try {
                CallJavaScriptReq callJavaScriptReq = new CallJavaScriptReq(methodName, arg);
                browser.getCefBrowser().executeJavaScript("callJavaScript('" + JSONUtil.toJsonStr(callJavaScriptReq) + "')", null, 0);
            } catch (Exception e) {
                LOG.error("callJavaScript error", e);
            }
        });
    }

    public void handleCallback(CallJavaReq callJavaReq) {
        Map<String, Object> args = callJavaReq.getArg();
        String requestId = args.get("requestId").toString();
        if (StringUtils.isNotBlank(requestId)) {
            Callback callback = callbacks.remove(requestId);
            if (callback != null) {
                callback.run(args);
            }
        }
    }

    private void startCallbackCleaner() {
        new Thread(() -> {
            while (true) {
                try {
                    DelayedTask task = delayQueue.take();
                    callbacks.remove(task.getRequestId());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }).start();
    }

    private static class DelayedTask implements Delayed {
        private final String requestId;
        private final long expirationTime;

        public DelayedTask(String requestId, long delay, TimeUnit unit) {
            this.requestId = requestId;
            this.expirationTime = System.currentTimeMillis() + unit.toMillis(delay);
        }

        public String getRequestId() {
            return requestId;
        }

        @Override
        public long getDelay(TimeUnit unit) {
            return unit.convert(expirationTime - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
        }

        @Override
        public int compareTo(Delayed o) {
            return Long.compare(this.getDelay(TimeUnit.MILLISECONDS), o.getDelay(TimeUnit.MILLISECONDS));
        }
    }
}
