package com.voidmuse.idea.plugin.util;

import com.intellij.notification.Notification;
import com.intellij.notification.NotificationType;
import com.intellij.notification.Notifications;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.ui.MessageType;
import com.intellij.openapi.ui.popup.Balloon.Position;
import com.intellij.openapi.ui.popup.JBPopupFactory;
import com.intellij.ui.awt.RelativePoint;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.awt.*;
import java.util.Arrays;

import static com.intellij.notification.NotificationType.INFORMATION;

public class OverlayUtil {

    public static final String NOTIFICATION_GROUP_ID = "VoidMuse Notification Group";
    public static final String NOTIFICATION_GROUP_STICKY_ID = "VoidMuse Notification Group Sticky";

    private OverlayUtil() {
    }

    public static Notification getDefaultNotification(
            @NotNull String content, @NotNull AnAction... actions) {
        return getDefaultNotification(content, INFORMATION, actions);
    }

    public static Notification getDefaultNotification(
            @NotNull String content, @NotNull NotificationType type, @NotNull AnAction... actions) {
        var notification = new Notification(NOTIFICATION_GROUP_ID, "VoidMuse", content, type);
        Arrays.asList(actions).forEach(notification::addAction);
        return notification;
    }

    public static Notification getStickyNotification(
            @NotNull String content, @NotNull AnAction... actions) {
        return getStickyNotification(content, INFORMATION, actions);
    }

    public static Notification getStickyNotification(
            @NotNull String content, @NotNull NotificationType type, @NotNull AnAction... actions) {
        var notification = new Notification(NOTIFICATION_GROUP_STICKY_ID, "VoidMuse", content, type);
        Arrays.asList(actions).forEach(notification::addAction);
        return notification;
    }

    public static Notification showNotification(
            @NotNull String content, @NotNull AnAction... actions) {
        return showNotification(content, INFORMATION, actions);
    }

    public static Notification showNotification(
            @NotNull String content, @NotNull NotificationType type, @NotNull AnAction... actions) {
        return notify(getDefaultNotification(content, type, actions));
    }

    public static Notification stickyNotification(
            @NotNull String content, @NotNull AnAction... actions) {
        return stickyNotification(content, INFORMATION, actions);
    }

    public static Notification stickyNotification(
            @NotNull String content, @NotNull NotificationType type, @NotNull AnAction... actions) {
        return notify(getStickyNotification(content, type, actions));
    }

    public static @NotNull Notification notify(
            @NotNull Notification notification, @NotNull AnAction... actions) {
        Arrays.asList(actions).forEach(notification::addAction);
        Notifications.Bus.notify(notification);
        return notification;
    }

    public static void showWarningBalloon(String content, Point locationOnScreen) {
        showBalloon(content, MessageType.WARNING, locationOnScreen);
    }

    public static void showInfoBalloon(String content, Point locationOnScreen) {
        showBalloon(content, MessageType.INFO, locationOnScreen);
    }

    private static void showBalloon(String content, MessageType messageType, Point locationOnScreen) {
        JBPopupFactory.getInstance()
                .createHtmlTextBalloonBuilder(content, messageType, null)
                .setFadeoutTime(2500)
                .createBalloon()
                .show(RelativePoint.fromScreen(locationOnScreen), Position.above);
    }

    public static void showBalloon(String content, MessageType messageType, JComponent component) {
        JBPopupFactory.getInstance()
                .createHtmlTextBalloonBuilder(content, messageType, null)
                .setFadeoutTime(2500)
                .createBalloon()
                .show(RelativePoint.getSouthOf(component), Position.below);
    }

    public static void showClosableBalloon(String content, MessageType messageType,
                                           JComponent component) {
        JBPopupFactory.getInstance()
                .createHtmlTextBalloonBuilder(content, messageType, null)
                .setCloseButtonEnabled(true)
                .createBalloon()
                .show(RelativePoint.getSouthOf(component), Position.below);
    }

}
