package com.voidmuse.idea.plugin.util;

import com.voidmuse.idea.plugin.common.PluginDataPersistent;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;

/**
 * @author zhangdaguan
 */
public class StateUtils {


    public static Boolean getCodebaseAutoIndexing() {
        PluginDataPersistent dataPersistent = PluginDataPersistent.getInstance();
        if (dataPersistent.getState() != null) {
            String autoIndexing = dataPersistent.getState().getData("global:isAutoEmbedding");
            if (StringUtils.isNotBlank(autoIndexing)) {
                return BooleanUtils.toBoolean(autoIndexing);
            }
        }
        return false;
    }
}
