package com.voidmuse.idea.plugin.factory;

import java.io.IOException;
import java.io.InputStream;
import java.net.JarURLConnection;
import java.net.URLConnection;
import org.cef.callback.CefCallback;
import org.cef.handler.CefLoadHandler;
import org.cef.handler.CefResourceHandler;
import org.cef.misc.IntRef;
import org.cef.misc.StringRef;
import org.cef.network.CefRequest;
import org.cef.network.CefResponse;

public class WebResourceHandler implements CefResourceHandler {
    private ResourceHandlerState state = new ClosedConnection();

    public WebResourceHandler(){

    }

    @Override
    public boolean processRequest(CefRequest request, CefCallback callback) {
        String url = request.getURL();
        if (url == null || url.isEmpty()) {
            return false;
        }

        String pathToResource = url.replace("http://voidmuse", "static");
        java.net.URL newUrl = getClass().getClassLoader().getResource(pathToResource);
        if (newUrl == null) {
            return false;
        }

        try {
            URLConnection connection = newUrl.openConnection();
            state = new OpenedConnection(connection);
            callback.Continue();
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public void getResponseHeaders(CefResponse response, IntRef responseLength, StringRef redirectUrl) {
        state.getResponseHeaders(response, responseLength, redirectUrl);
    }

    @Override
    public boolean readResponse(byte[] dataOut, int bytesToRead, IntRef bytesRead, CefCallback callback) {
        return state.readResponse(dataOut, bytesToRead, bytesRead, callback);
    }

    @Override
    public void cancel() {
        state.close();
        state = new ClosedConnection();
    }
}

abstract class ResourceHandlerState {
    public abstract void getResponseHeaders(CefResponse response, IntRef responseLength, StringRef redirectUrl);
    public abstract boolean readResponse(byte[] dataOut, int bytesToRead, IntRef bytesRead, CefCallback callback);
    public void close() {}
}

class OpenedConnection extends ResourceHandlerState {
    private final URLConnection connection;
    private InputStream inputStream;
    private boolean streamInitialized = false;

    public OpenedConnection(URLConnection connection) {
        this.connection = connection;
    }

    private void initializeStream() throws IOException {
        if (!streamInitialized) {
            this.inputStream = connection.getInputStream();
            streamInitialized = true;
        }
    }

    @Override
    public void getResponseHeaders(CefResponse response, IntRef responseLength, StringRef redirectUrl) {
        try {
            initializeStream();
            String url = connection.getURL().toString();

            if (url.contains(".css")) {
                response.setMimeType("text/css");
            } else if (url.contains(".js")) {
                response.setMimeType("text/javascript");
            } else if (url.contains(".html")) {
                response.setMimeType("text/html");
            } else {
                response.setMimeType(connection.getContentType());
            }

            responseLength.set(inputStream.available());
            response.setStatus(200);
        } catch (IOException e) {
            response.setError(CefLoadHandler.ErrorCode.ERR_FILE_NOT_FOUND);
            response.setStatusText(e.getLocalizedMessage());
            response.setStatus(404);
        }
    }

    @Override
    public boolean readResponse(byte[] dataOut, int bytesToRead, IntRef bytesRead, CefCallback callback) {
        try {
            initializeStream();
            int available = inputStream.available();
            if (available <= 0) {
                inputStream.close();
                return false;
            }

            int bytesToReadActual = Math.min(available, bytesToRead);
            int readCount = inputStream.read(dataOut, 0, bytesToReadActual);
            if (readCount > 0) {
                bytesRead.set(readCount);
                return true;
            } else {
                inputStream.close();
                return false;
            }
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public void close() {
        if (inputStream != null) {
            try {
                inputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}

class ClosedConnection extends ResourceHandlerState {
    @Override
    public void getResponseHeaders(CefResponse response, IntRef responseLength, StringRef redirectUrl) {
        response.setStatus(404);
    }

    @Override
    public boolean readResponse(byte[] dataOut, int bytesToRead, IntRef bytesRead, CefCallback callback) {
        return false;
    }
}


