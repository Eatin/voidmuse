package com.voidmuse.idea.plugin.service;

import cn.hutool.json.JSONUtil;
import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.application.ModalityState;
import com.intellij.ui.jcef.JBCefBrowser;
import com.voidmuse.idea.plugin.call.CallJavaCallbackReq;
import com.voidmuse.idea.plugin.call.CallJavaReq;
import com.voidmuse.idea.plugin.protocol.CallJavaHandlerImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.cef.browser.CefBrowser;
import org.cef.browser.CefFrame;
import org.cef.callback.CefQueryCallback;
import org.cef.handler.CefMessageRouterHandlerAdapter;

import javax.swing.*;
import java.util.HashMap;
import java.util.Map;

/**
 * @author zhangdaguan
 */
@Slf4j
@Service(Service.Level.PROJECT)
public final class ProtocDispatchService extends CefMessageRouterHandlerAdapter {
    private static final Logger LOG = Logger.getInstance(ProtocDispatchService.class);
    private final Project project;

    public ProtocDispatchService(Project project) {
        this.project = project;
    }

    public static ProtocDispatchService getInstance(Project project) {
        return project.getService(ProtocDispatchService.class);
    }

    @Override
    public boolean onQuery(CefBrowser browser, CefFrame frame, long queryId, String request, boolean persistent, CefQueryCallback callback) {
        try {
            CallJavaReq callJavaReq = JSONUtil.toBean(request, CallJavaReq.class);
            LOG.info("callJavaReq:" + callJavaReq);

            String requestId = callJavaReq.getRequestId();
            if (StringUtils.isNotBlank(requestId)) {
                callback.success("");
                //这里进行异步处理，得到结果response再调用calJavaCallback去回调请求
                ApplicationManager.getApplication().executeOnPooledThread(() -> {
                    try {
                        String response = CallJavaHandlerImpl.getInstance().handleCallJava(project, callJavaReq);
                        callJavaCallback(project, requestId, response);
                    } catch (Exception e) {
                        LOG.error("handleCallJava error", e);
                        // 发生错误时也要回调JavaScript，避免界面卡住
                        callJavaCallback(project, requestId, "{\"error\":\"" + e.getMessage() + "\"}");
                    }
                });
            } else {
                String response = CallJavaHandlerImpl.getInstance().handleCallJava(project, callJavaReq);
                callback.success(response);
            }
            return true;
        } catch (Exception e) {
            LOG.error("ProtocDispatchService onQuery error.", e);
            callback.failure(-1, e.getMessage());
        }
        return false;
    }


    private static void callJavaCallback(Project project, String requestId, String response) {
        JBCefBrowser browser = ProjectBeanService.getInstance(project).getBrowser();
        // 使用IDEA的invokeLater确保在EDT中执行
        ApplicationManager.getApplication().invokeLater(() -> {
            try {
                Map<String, Object> args = new HashMap<>();
                //要处理两层解析的转义符
                String transResponse = JSONUtil.quote(response);
                if (transResponse.length() >= 2) {
                    transResponse = transResponse.substring(1, transResponse.length() - 1);
                }
                args.put("response", transResponse);
                CallJavaCallbackReq callJavaCallbackReq = new CallJavaCallbackReq(requestId, args);
                browser.getCefBrowser().executeJavaScript("callJavaCallback('" + JSONUtil.toJsonStr(callJavaCallbackReq) + "')", null, 0);
            } catch (Exception e) {
                LOG.error("callJavaCallback error", e);
            }
        }, ModalityState.NON_MODAL);
    }
}
