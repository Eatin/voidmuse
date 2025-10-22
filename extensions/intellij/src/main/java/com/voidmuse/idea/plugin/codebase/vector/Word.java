package com.voidmuse.idea.plugin.codebase.vector;

import java.io.Serial;
import java.io.Serializable;
import java.util.Arrays;

public class Word implements Serializable {

  @Serial
  private static final long serialVersionUID = 1L;

  private final String id;
  private final String meta;
  private final double[] vector;

  public Word(String id, String meta, double[] vector) {
    this.id = id;
    this.meta = meta;
    this.vector = vector;
  }


  public String id() {
    return id;
  }


  public double[] vector() {
    return vector;
  }


  public int dimensions() {
    return vector.length;
  }

  @Override
  public String toString() {
    return "Word{" +
        "id='" + id + '\'' +
        ", vector=" + Arrays.toString(vector) +
        '}';
  }

  public String getMeta() {
    return meta;
  }
}