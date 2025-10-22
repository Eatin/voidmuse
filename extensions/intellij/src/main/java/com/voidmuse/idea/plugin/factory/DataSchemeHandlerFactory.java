package com.voidmuse.idea.plugin.factory;
import org.cef.browser.CefBrowser;
import org.cef.browser.CefFrame;
import org.cef.callback.CefSchemeHandlerFactory;
import org.cef.handler.CefResourceHandler;
import org.cef.network.CefRequest;

public class DataSchemeHandlerFactory implements CefSchemeHandlerFactory {
    public CefResourceHandler create(CefBrowser cefBrowser, CefFrame cefFrame, String s, CefRequest cefRequest) {
        return new WebResourceHandler();
    }
}
