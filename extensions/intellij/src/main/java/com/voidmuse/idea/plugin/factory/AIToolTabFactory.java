package com.voidmuse.idea.plugin.factory;

import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowFactory;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import com.intellij.ui.jcef.JBCefBrowser;
import com.intellij.ui.jcef.JBCefClient;
import com.voidmuse.idea.plugin.service.ProjectBeanService;
import com.voidmuse.idea.plugin.service.ProtocDispatchService;
import com.voidmuse.idea.plugin.setting.ConfigurationSettings;
import com.voidmuse.idea.plugin.setting.ConfigurationSettingsState;
import com.voidmuse.idea.plugin.util.StateUtils;
import org.cef.CefApp;
import org.cef.browser.CefBrowser;
import org.cef.browser.CefFrame;
import org.cef.browser.CefMessageRouter;
import org.cef.handler.CefLoadHandler;
import org.cef.network.CefRequest;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.awt.*;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class AIToolTabFactory implements ToolWindowFactory {

    private static final Logger LOG = Logger.getInstance(AIToolTabFactory.class);

    @Override
    public void createToolWindowContent(@NotNull Project project, @NotNull ToolWindow toolWindow) {
        try {
            LOG.info("Creating VoidMuse tool window content for project: " + project.getName());
            
            JBCefBrowser browser = new JBCefBrowser();
            ProjectBeanService.getInstance(project).setBrowser(browser);

            JPanel panel = new JPanel(new BorderLayout());
            panel.add(browser.getComponent(), BorderLayout.CENTER);
            ContentFactory contentFactory = ContentFactory.getInstance();
            Content content = contentFactory.createContent(panel, "", false);
            content.setCloseable(false);
            toolWindow.getContentManager().addContent(content);

            JBCefClient jbCefClient = browser.getJBCefClient();

            CefMessageRouter.CefMessageRouterConfig routerConfig =
                    new CefMessageRouter.CefMessageRouterConfig("callJava", "callJavaCancel");

            CefMessageRouter messageRouter = CefMessageRouter.create(routerConfig,
                    ProtocDispatchService.getInstance(project));
            jbCefClient.getCefClient().addMessageRouter(messageRouter);

            // Get configuration settings
            ConfigurationSettingsState config = ConfigurationSettings.getState();
            String targetUrl;
            
            if (config.getUseCustomServer()) {
                // Use custom server URL from configuration
                targetUrl = config.getServerUrl();
                LOG.info("Using custom server URL from configuration: " + targetUrl);
            } else {
                // 新的环境模式逻辑
                String environmentMode = config.getEnvironmentMode();
                LOG.info("Environment mode from configuration: " + environmentMode);
                
                if ("development".equals(environmentMode)) {
                    // 开发模式
                    targetUrl = config.getCustomDevUrl() != null ? config.getCustomDevUrl() : "http://localhost:3002/";
                    LOG.info("Using development mode with URL: " + targetUrl);
                } else if ("production".equals(environmentMode)) {
                    // 生产模式
                    targetUrl = config.getCustomProdUrl() != null ? config.getCustomProdUrl() : "http://voidmuse/index.html";
                    LOG.info("Using production mode with URL: " + targetUrl);
                    
                    // 尝试注册scheme handler
                    try {
                        CefApp.getInstance()
                                .registerSchemeHandlerFactory("http", "voidmuse", new DataSchemeHandlerFactory());
                        LOG.info("Scheme handler registered successfully");
                    } catch (Exception e) {
                        LOG.error("Failed to register scheme handler, will use static HTML fallback", e);
                    }
                } else {
                    // auto模式或兼容旧的环境变量逻辑
                    boolean isDevelopmentMode = "true".equals(System.getenv("VOIDMUSE_DEV_MODE")) 
                            || "true".equals(System.getProperty("voidmuse.dev.mode"));
                    
                    if (isDevelopmentMode) {
                        // Development mode: use localhost server
                        targetUrl = "http://localhost:3002/";
                        LOG.info("Auto mode: Using development server at: " + targetUrl);
                    } else {
                        // Production mode: use static resources
                        targetUrl = "http://voidmuse/index.html";
                        try {
                            CefApp.getInstance()
                                    .registerSchemeHandlerFactory("http", "voidmuse", new DataSchemeHandlerFactory());
                            LOG.info("Auto mode: Using static resources with scheme handler");
                        } catch (Exception e) {
                            LOG.error("Failed to register scheme handler factory, falling back to static content", e);
                            // Fallback to loading static HTML directly
                            String htmlContent = loadStaticHtmlContent();
                            browser.loadHTML(htmlContent);
                            return;
                        }
                    }
                }
            }

            //添加一个监听，页面加载完成后再注册一次事件，防止丢失
            jbCefClient.addLoadHandler(new CefLoadHandler() {
                @Override
                public void onLoadingStateChange(CefBrowser browser, boolean isLoading, boolean canGoBack, boolean canGoForward) {
                    if (!isLoading) {
                        jbCefClient.getCefClient().addMessageRouter(messageRouter);
                        LOG.info("Page loaded successfully, message router re-registered");
                    }
                }

                @Override
                public void onLoadStart(CefBrowser browser, CefFrame frame, CefRequest.TransitionType transitionType) {
                    LOG.info("Page load started: " + frame.getURL());
                }

                @Override
                public void onLoadEnd(CefBrowser browser, CefFrame frame, int httpStatusCode) {
                    LOG.info("Page load ended with status: " + httpStatusCode);
                }

                @Override
                public void onLoadError(CefBrowser browser, CefFrame frame, ErrorCode errorCode, String errorText, String failedUrl) {
                    LOG.error("Page load error - Code: " + errorCode + ", Text: " + errorText + ", URL: " + failedUrl);
                }
            }, browser.getCefBrowser());

            browser.loadURL(targetUrl);
            LOG.info("VoidMuse tool window content created successfully");
        } catch (Exception e) {
            LOG.error("Failed to create tool window content", e);
            // Create fallback content
            createFallbackContent(toolWindow);
        }
    }
    
    private String loadStaticHtmlContent() {
        try {
            InputStream is = getClass().getClassLoader().getResourceAsStream("static/index.html");
            if (is != null) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            LOG.error("Failed to load static HTML content", e);
        }
        return "<html><body><h1>VoidMuse</h1><p>Welcome to VoidMuse!</p></body></html>";
    }
    
    private void createFallbackContent(ToolWindow toolWindow) {
        JPanel panel = new JPanel(new BorderLayout());
        JLabel label = new JLabel("VoidMuse - AI Development Assistant", SwingConstants.CENTER);
        label.setFont(label.getFont().deriveFont(16f));
        panel.add(label, BorderLayout.CENTER);
        
        ContentFactory contentFactory = ContentFactory.getInstance();
        Content content = contentFactory.createContent(panel, "", false);
        content.setCloseable(false);
        toolWindow.getContentManager().addContent(content);
    }
}
