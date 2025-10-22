package com.voidmuse.idea.plugin.editor.custom;

import com.intellij.util.ui.UIUtil;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.geom.RoundRectangle2D;

/**
 * @author zhangdaguan
 */
public class CustomButton extends JLabel {
    private boolean isHovered = false;
    public static final Font DEFAULT_FONT = UIUtil.getFontWithFallback("Arial", Font.PLAIN, 14);

    public CustomButton(String text, Font font, Runnable onClick) {
        super(text, CENTER);
        setOpaque(false);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        setFont(font);
        setBorder(new EmptyBorder(2, 6, 2, 6));

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

            @Override
            public void mouseClicked(MouseEvent e) {
                onClick.run();
            }
        });
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int cornerRadius = 8;
        RoundRectangle2D roundRect = new RoundRectangle2D.Float(0, 0, getWidth(), getHeight(), cornerRadius, cornerRadius);
        g2.setColor(isHovered ? brighten(getBackground()) : getBackground());
        g2.fill(roundRect);
        g2.setColor(getForeground());
        FontMetrics fm = g.getFontMetrics();
        g2.drawString(getText(), (getWidth() - fm.stringWidth(getText())) / 2,
                (getHeight() + fm.getAscent() - fm.getDescent()) / 2);
    }

    private Color brighten(Color color) {
        float brightenFactor = 1.1f;
        return new Color(
                Math.min((int) (color.getRed() * brightenFactor), 255),
                Math.min((int) (color.getGreen() * brightenFactor), 255),
                Math.min((int) (color.getBlue() * brightenFactor), 255)
        );
    }
}

