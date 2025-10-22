package com.voidmuse.idea.plugin.editor;



import com.intellij.openapi.components.Service;
import com.intellij.openapi.editor.Editor;

import java.util.HashMap;
import java.util.Map;
/**
 * @author zhangdaguan
 */
@Service(Service.Level.PROJECT)
public class DiffStreamService {
    private final Map<Editor, DiffStreamHandler> handlers = new HashMap<>();

    public void register(DiffStreamHandler handler, Editor editor) {
        if (handlers.containsKey(editor)) {
            handlers.get(editor).rejectAll();
        }
        handlers.put(editor, handler);
    }

    public void reject(Editor editor) {
        DiffStreamHandler handler = handlers.get(editor);
        if (handler != null) {
            handler.rejectAll();
            handlers.remove(editor);
        }
    }

    public void accept(Editor editor) {
        DiffStreamHandler handler = handlers.get(editor);
        if (handler != null) {
            handler.acceptAll();
            handlers.remove(editor);
        }
    }

}
