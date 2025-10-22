package com.voidmuse.idea.plugin.common;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.EncodingType;
import com.knuddels.jtokkit.api.IntArrayList;

import java.util.List;

@Service
public final class EncodingManager {

  private static final String SPECIAL_START = "<|";
  private static final String SPECIAL_END = "|>";

  private static final Logger LOG = Logger.getInstance(EncodingManager.class);

  private final EncodingRegistry registry = Encodings.newDefaultEncodingRegistry();
  private final Encoding encoding = registry.getEncoding(EncodingType.CL100K_BASE);

  private EncodingManager() {
  }

  public static EncodingManager getInstance() {
    return ApplicationManager.getApplication().getService(EncodingManager.class);
  }

  public int countTokens(String text) {
    if (text == null || text.isEmpty()) {
      return 0;
    }

    try {
      // #444: Cl100kParser.split() throws AssertionError "Input is not UTF-8: "
      return encoding.countTokens(text.replaceAll("<|", "").replaceAll("|>", ""));
    } catch (Exception | Error ex) {
      LOG.warn("Could not count tokens for: " + text, ex);
      return 0;
    }
  }

  /**
   * Truncates the given text to the given number of tokens.
   *
   * @param text      The text to truncate.
   * @param maxTokens The maximum number of tokens to keep.
   * @param fromStart Whether to truncate from the start or the end of the text.
   * @return The truncated text.
   */
  public String truncateText(String text, int maxTokens, boolean fromStart) {
    var textWithSpecialEncodingsRemoved = text.replace(SPECIAL_START, "").replace(SPECIAL_END, "");
    var tokens = encoding.encode(textWithSpecialEncodingsRemoved);
    int tokensToRetrieve = Math.min(maxTokens, tokens.size());
    int startIndex = fromStart ? 0 : tokens.size() - tokensToRetrieve;
    var truncatedList =
        tokens.boxed().subList(startIndex, startIndex + tokensToRetrieve);
    return encoding.decode(convertToIntArrayList(truncatedList));
  }

  private IntArrayList convertToIntArrayList(List<Integer> tokens) {
    var result = new IntArrayList(tokens.size());
    tokens.forEach(result::add);
    return result;
  }
}
