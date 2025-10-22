package com.voidmuse.idea.plugin.editor;

import com.intellij.openapi.editor.colors.EditorColorsManager;
import com.intellij.openapi.editor.colors.EditorFontType;

import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.geom.RoundRectangle2D;
/**
 * @author zhangdaguan
 */
public class StyledButton extends JButton {
    private boolean isHovered = false;
    private final Color editorBackground;

    public StyledButton(String text) {
        super(text);
        setBorder(null);
        setContentAreaFilled(false);
        setFocusPainted(false);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));

        EditorColorsManager scheme = EditorColorsManager.getInstance();
        Font editorFont = scheme.getGlobalScheme().getFont(EditorFontType.PLAIN);
        int editorFontSize = editorFont.getSize();

        setFont(getFont().deriveFont(editorFontSize * 1.1f));

        editorBackground = scheme.getGlobalScheme().getDefaultBackground();

        addMouseListener(new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) {
                isHovered = true;
                repaint();
            }

            @Override
            public void mouseExited(MouseEvent e) {
                isHovered = false;
                repaint();
            }
        });
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        float width = getWidth();
        float height = getHeight();
        float arc = 0f;

        // Draw semi-transparent background
        g2.setColor(isHovered? editorBackground.brighter() : editorBackground);
        g2.fill(new RoundRectangle2D.Float(0f, 0f, width, height, arc, arc));

        // Draw border
        g2.setColor(isHovered ? getForeground().darker() : getForeground().darker().darker());
        g2.setStroke(new BasicStroke(1f));
        g2.draw(new RoundRectangle2D.Float(0.5f, 0.5f, width - 1f, height - 1f, arc, arc));

        super.paintComponent(g);
        g2.dispose();
    }
}

