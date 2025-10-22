package com.voidmuse.idea.plugin.common;

import com.intellij.openapi.util.IconLoader;
import com.intellij.ui.AnimatedIcon;

import javax.swing.*;

public final class Icons {
  public static final Icon DefaultSmall =
          IconLoader.getIcon("/icons/pluginIcon.svg", Icons.class);
  public static final Icon StatusBarCompletionInProgress = new AnimatedIcon.Default();
}
