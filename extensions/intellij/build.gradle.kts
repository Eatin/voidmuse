import org.jetbrains.changelog.markdownToHTML


fun properties(key: String): Provider<String> {
    return providers.gradleProperty(key)
}

plugins {
    id("java")
    id("idea")
    id("org.jetbrains.intellij") version "1.17.4"
    id("org.jetbrains.kotlin.jvm") version "1.9.21"
    id("org.jetbrains.changelog") version "2.2.1"
}

group = properties("pluginGroup").get()
version = properties("pluginVersion").get() + "-" + properties("pluginSinceBuild").get()

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "17"
    }
}

repositories {
    mavenCentral()
    gradlePluginPortal()
}

intellij {
    pluginName.set(properties("pluginName"))
    version.set(properties("platformVersion"))
    type.set(properties("platformType"))
    plugins.set(listOf("java", "PythonCore:243.24978.46"))//, "PythonCore:241.14494.240"
}

sourceSets {
    val main by getting {
        kotlin {
            srcDirs("src/main/kotlin") // 添加 Kotlin 源代码目录
        }
        java {
            srcDirs("src/main/java") // 添加 Java 源代码目录
        }
    }
}

dependencies {
    implementation("cn.hutool:hutool-all:5.8.24")
    implementation("io.github.java-diff-utils:java-diff-utils:4.12")
    compileOnly("org.projectlombok:lombok:1.18.30")
    implementation("com.jetbrains:ideaIC:2024.3.5")
    annotationProcessor("org.projectlombok:lombok:1.18.30")
    implementation("com.knuddels:jtokkit:1.1.0")
    implementation("io.modelcontextprotocol.sdk:mcp:0.11.3")
    // 添加Lucene依赖
    implementation("org.apache.lucene:lucene-queryparser:9.12.0")
}

tasks {
    verifyPlugin {
        enabled = true
    }
    runPluginVerifier {
        enabled = true
    }

    patchPluginXml {
        enabled = true
        version.set(properties("pluginVersion").get() + "-" + properties("pluginSinceBuild").get())
        sinceBuild.set(properties("pluginSinceBuild"))
        untilBuild.set(properties("pluginUntilBuild"))

        pluginDescription.set(providers.fileContents(layout.projectDirectory.file("README.md")).asText.map {
            val start = "<!-- Plugin description -->"
            val end = "<!-- Plugin description end -->"

            with(it.lines()) {
                if (!containsAll(listOf(start, end))) {
                    throw GradleException("Plugin description section not found in DESCRIPTION.md:\n$start ... $end")
                }
                subList(indexOf(start) + 1, indexOf(end)).joinToString("\n").let(::markdownToHTML)
            }
        })
    }

    buildPlugin {
        enabled = true
    }

    runIde {
        enabled = true
        autoReloadPlugins.set(false)
        // jdk19以上才支持
        systemProperty("org.apache.lucene.store.MMapDirectory.enableMemorySegments", "false")
    }
}
