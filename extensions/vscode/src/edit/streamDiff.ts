import { distance } from "fastest-levenshtein";

type LineStream = AsyncGenerator<string>;

interface DiffLine {
    type: DiffLineType;
    line: string;
}

type DiffLineType = "new" | "old" | "same";


export async function* streamDiff(
    oldLines: string[],
    newLines: string[],
): AsyncGenerator<DiffLine> {
    const oldLinesCopy = [...oldLines];
    const newLinesCopy = [...newLines];

    let seenIndentationMistake = false;
    let newLineIndex = 0;

    while (oldLinesCopy.length > 0 && newLineIndex < newLinesCopy.length) {
        const newLineResult = newLinesCopy[newLineIndex];
        const { matchIndex, isPerfectMatch, newLine } = matchLine(
            newLineResult,
            oldLinesCopy,
            seenIndentationMistake,
        );

        if (!seenIndentationMistake && newLinesCopy[newLineIndex] !== newLine) {
            seenIndentationMistake = true;
        }

        let type: DiffLineType;
        let isLineRemoval = false;
        const isNewLine = matchIndex === -1;

        if (isNewLine) {
            type = "new";
        } else {
            for (let i = 0; i < matchIndex; i++) {
                yield { type: "old", line: oldLinesCopy.shift()! };
            }

            type = isPerfectMatch ? "same" : "old";
        }

        switch (type) {
            case "new":
                yield { type, line: newLine };
                newLineIndex++;
                break;
            case "same":
                yield { type, line: oldLinesCopy.shift()! };
                newLineIndex++;
                break;
            case "old":
                yield { type, line: oldLinesCopy.shift()! };

                if (oldLinesCopy[0] !== newLine) {
                    yield { type: "new", line: newLine };
                    newLineIndex++;
                } else {
                    isLineRemoval = true;
                }
                break;
            default:
                console.error(`Error streaming diff, unrecognized diff type: ${type}`);
        }
    }


    if (oldLinesCopy.length > 0) {
        for (const oldLine of oldLinesCopy) {
            yield { type: "old", line: oldLine };
        }
    }


    if (newLineIndex < newLinesCopy.length) {
        for (let i = newLineIndex; i < newLinesCopy.length; i++) {
            yield { type: "new", line: newLinesCopy[i] };
        }
    }
}

type MatchLineResult = {
    /**
     * -1 if it's a new line, otherwise the index of the first match
     * in the old lines.
     */
    matchIndex: number;
    isPerfectMatch: boolean;
    newLine: string;
};

const END_BRACKETS = ["}", "});", "})"];

function linesMatchPerfectly(lineA: string, lineB: string): boolean {
    return lineA.replace(/[\r\n]/g,"") === lineB.replace(/[\r\n]/g,"") && lineA !== "";
}

function linesMatch(lineA: string, lineB: string, linesBetween = 0): boolean {
    // Require a perfect (without padding) match for these lines
    // Otherwise they are edit distance 1 from empty lines and other single char lines (e.g. each other)
    if (["}", "*", "});", "})"].includes(lineA.trim())) {
        return lineA.trim() === lineB.trim();
    }

    const d = distance(lineA, lineB);

    return (
        // Should be more unlikely for lines to fuzzy match if they are further away
        (d / Math.max(lineA.length, lineB.length) <=
            Math.max(0, 0.48 - linesBetween * 0.06) ||
            lineA.trim() === lineB.trim()) &&
        lineA.trim() !== ""
    );
}


function matchLine(
    newLine: string,
    oldLines: string[],
    permissiveAboutIndentation = false,
): MatchLineResult {
    // Only match empty lines if it's the next one:
    if (newLine.trim() === "" && oldLines[0]?.trim() === "") {
        return {
            matchIndex: 0,
            isPerfectMatch: true,
            newLine: newLine.trim(),
        };
    }

    const isEndBracket = END_BRACKETS.includes(newLine.trim());

    for (let i = 0; i < oldLines.length; i++) {
        // Don't match end bracket lines if too far away
        if (i > 4 && isEndBracket) {
            return { matchIndex: -1, isPerfectMatch: false, newLine };
        }

        if (linesMatchPerfectly(newLine, oldLines[i])) {
            return { matchIndex: i, isPerfectMatch: true, newLine };
        }
        if (linesMatch(newLine, oldLines[i], i)) {
            // This is a way to fix indentation, but only for sufficiently long lines to avoid matching whitespace or short lines
            if (
                newLine.trimStart() === oldLines[i].trimStart() &&
                (permissiveAboutIndentation || newLine.trim().length > 8)
            ) {
                return {
                    matchIndex: i,
                    isPerfectMatch: true,
                    newLine: oldLines[i],
                };
            }
            return { matchIndex: i, isPerfectMatch: false, newLine };
        }
    }

    return { matchIndex: -1, isPerfectMatch: false, newLine };
}