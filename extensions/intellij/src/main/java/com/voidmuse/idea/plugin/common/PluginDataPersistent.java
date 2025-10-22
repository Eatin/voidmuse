package com.voidmuse.idea.plugin.common;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.PersistentStateComponent;
import com.intellij.openapi.components.ServiceManager;
import com.intellij.openapi.components.State;
import com.intellij.openapi.components.Storage;
import com.voidmuse.idea.plugin.domain.DataState;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

@State(name = "DataPersistent", storages = @Storage("plugin.xml"))
public class PluginDataPersistent implements PersistentStateComponent<DataState> {

    private DataState state = new DataState();

    private static PluginDataPersistent dataPersistent;

    public static PluginDataPersistent getInstance() {
        if (dataPersistent == null) {
            dataPersistent = ApplicationManager.getApplication().getService(PluginDataPersistent.class);
        }

        return dataPersistent;
    }

    @Override
    public @Nullable DataState getState() {
        return state;
    }

    @Override
    public void loadState(@NotNull DataState state) {
        this.state = state;
    }


}
