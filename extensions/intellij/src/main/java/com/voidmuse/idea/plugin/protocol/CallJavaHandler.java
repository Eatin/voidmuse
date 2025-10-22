package com.voidmuse.idea.plugin.protocol;

import com.intellij.openapi.project.Project;
import com.voidmuse.idea.plugin.call.CallJavaReq;

/**
 * @author zhangdaguan
 */
public interface CallJavaHandler {

    String handleCallJava(Project project, CallJavaReq callJavaReq) throws Exception;

}
