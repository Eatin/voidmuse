#!/bin/bash
echo "检查JCEF状态..."
echo "Java版本:"
java -version 2>&1
echo ""
echo "系统属性:"
java -XshowSettings:properties -version 2>&1 | grep -i jcef || echo "JCEF未找到"
echo ""
echo "IDEA JCEF设置:"
echo "在IDEA中，请检查：Help -> Diagnostic Tools -> Debug Log Settings"
echo "添加 #com.voidmuse.idea.plugin.factory.AdvancedToolWindowFactory 来启用调试日志"