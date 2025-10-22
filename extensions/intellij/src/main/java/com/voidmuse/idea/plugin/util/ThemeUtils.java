package com.voidmuse.idea.plugin.util;

import com.intellij.openapi.editor.colors.EditorColorsManager;
import com.intellij.openapi.editor.colors.EditorColorsScheme;

import java.awt.Color;

/**
 * Utility class for theme-related operations.
 *
 * @author zhangdaguan
 */
public final class ThemeUtils {

    private static final double RED_WEIGHT = 0.3;
    private static final double GREEN_WEIGHT = 0.59;
    private static final double BLUE_WEIGHT = 0.11;
    private static final int GRAYSCALE_THRESHOLD = 128;
    private static final int COLOR_ADJUSTMENT = 20;

    private ThemeUtils() {
        // Utility class, prevent instantiation
    }

    /**
     * Gets a slightly darkened or lightened background color based on the current theme.
     *
     * @return adjusted background color
     */
    public static Color getAdjustedBackgroundColor() {
        EditorColorsScheme globalScheme = EditorColorsManager.getInstance().getGlobalScheme();
        Color defaultBackground = globalScheme.getDefaultBackground();

        int grayscaleValue = calculateGrayscaleValue(defaultBackground);
        return adjustColorBasedOnBrightness(defaultBackground, grayscaleValue);
    }

    private static int calculateGrayscaleValue(Color color) {
        return (int) (color.getRed() * RED_WEIGHT
                    + color.getGreen() * GREEN_WEIGHT
                    + color.getBlue() * BLUE_WEIGHT);
    }

    private static Color adjustColorBasedOnBrightness(Color originalColor, int grayscaleValue) {
        int adjustedRed = originalColor.getRed();
        int adjustedGreen = originalColor.getGreen();
        int adjustedBlue = originalColor.getBlue();

        if (grayscaleValue > GRAYSCALE_THRESHOLD) {
            adjustedRed = Math.max(0, adjustedRed - COLOR_ADJUSTMENT);
            adjustedGreen = Math.max(0, adjustedGreen - COLOR_ADJUSTMENT);
            adjustedBlue = Math.max(0, adjustedBlue - COLOR_ADJUSTMENT);
        } else {
            adjustedRed = Math.min(255, adjustedRed + COLOR_ADJUSTMENT);
            adjustedGreen = Math.min(255, adjustedGreen + COLOR_ADJUSTMENT);
            adjustedBlue = Math.min(255, adjustedBlue + COLOR_ADJUSTMENT);
        }

        return new Color(adjustedRed, adjustedGreen, adjustedBlue);
    }

    /**
     * Determines if the current theme is dark or light based on the background color.
     *
     * @return true if the theme is dark, false if light
     */
    public static boolean isDarkTheme() {
        EditorColorsScheme globalScheme = EditorColorsManager.getInstance().getGlobalScheme();
        Color defaultBackground = globalScheme.getDefaultBackground();
        int grayscaleValue = calculateGrayscaleValue(defaultBackground);
        return grayscaleValue <= GRAYSCALE_THRESHOLD;
    }
}

