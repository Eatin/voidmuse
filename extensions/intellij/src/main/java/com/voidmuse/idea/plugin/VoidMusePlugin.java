package com.voidmuse.idea.plugin;

import com.intellij.openapi.application.PathManager;
import com.intellij.openapi.extensions.PluginId;
import com.intellij.openapi.project.Project;
import org.jetbrains.annotations.NotNull;

import java.io.File;

import static java.util.Objects.requireNonNull;

public final class VoidMusePlugin {

  public static final PluginId Plugin_ID = PluginId.getId("com.voidmuse.idea.plugin.VoidMuse");

  private VoidMusePlugin() {
  }

  public static @NotNull String getPluginOptionsPath() {
    return PathManager.getOptionsPath() + File.separator + "VoidMuse";
  }

  public static @NotNull String getIndexStorePath() {
    return getPluginOptionsPath() + File.separator + "indexes";
  }

  public static @NotNull String getProjectIndexStorePath(@NotNull Project project) {
    return getIndexStorePath() + File.separator + project.getName();
  }
}
