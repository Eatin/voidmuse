package com.voidmuse.idea.plugin.editor.diff;

import com.github.difflib.DiffUtils;
import com.github.difflib.algorithm.myers.MeyersDiff;
import com.github.difflib.patch.AbstractDelta;
import com.github.difflib.patch.DeltaType;
import com.github.difflib.patch.Patch;
import com.github.difflib.text.DiffRow;
import com.github.difflib.text.DiffRowGenerator;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 完整文本对比
 *
 * @author zhangdaguan
 */
public class TextDiff {
    private final List<String> oldLines;
    private final List<String> newLines;

    public TextDiff(List<String> oldLines, List<String> newLines) {
        this.oldLines = oldLines;
        this.newLines = newLines;
    }


    public List<DiffLine> genDiffLines() {
        Patch<String> patch = DiffUtils.diff(oldLines, newLines, true);
        List<DiffLine> diffLines = new ArrayList<>();
        for (AbstractDelta<String> delta : patch.getDeltas()) {
            if (delta.getType().equals(DeltaType.INSERT)) {
                for (String line : delta.getTarget().getLines()) {
                    diffLines.add(new DiffLine(DiffLineType.NEW, line));
                }
            } else if (delta.getType().equals(DeltaType.CHANGE)) {
                for (String line : delta.getSource().getLines()) {
                    diffLines.add(new DiffLine(DiffLineType.OLD, line));
                }
                for (String line : delta.getTarget().getLines()) {
                    diffLines.add(new DiffLine(DiffLineType.NEW, line));
                }
            } else if (delta.getType().equals(DeltaType.EQUAL)) {
                for (String line : delta.getSource().getLines()) {
                    diffLines.add(new DiffLine(DiffLineType.SAME, line));
                }
            } else if (delta.getType().equals(DeltaType.DELETE)) {
                for (String line : delta.getSource().getLines()) {
                    diffLines.add(new DiffLine(DiffLineType.OLD, line));
                }
            }
        }
        return diffLines;
    }


    public static void main(String[] args) {
        DiffRowGenerator generator = DiffRowGenerator.create()
//                .showInlineDiffs(true)
//                .inlineDiffByWord(true)
//                .mergeOriginalRevised(true)
                .build();
        List<String> oldLines = Arrays.asList("List<Integer> test = 1; This is a test senctence.",
                "This is the second line.", "And here is the finish.");
        List<String> newLines = Arrays.asList("ADD one line", "This is a test for diffutils.", "This is the second line.");
        List<DiffRow> rows = generator.generateDiffRows(
                oldLines,
                newLines);

        System.out.println("|original|new|");
        System.out.println("|--------|---|");
        for (DiffRow row : rows) {
            System.out.println("|" + row.getOldLine() + "|" + row.getNewLine() + "|" + row.getTag());
        }


        Patch<String> patch = DiffUtils.diff(oldLines, newLines, new MeyersDiff<>());
        for (AbstractDelta delta : patch.getDeltas()) {
            System.out.println(delta);
        }
    }
}
