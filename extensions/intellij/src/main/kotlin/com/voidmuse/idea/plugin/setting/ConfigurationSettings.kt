package com.voidmuse.idea.plugin.setting

import com.intellij.openapi.components.*

@Service
@State(
    name = "VoidMuse_ConfigurationSettings",
    storages = [Storage("VoidMuse_ConfigurationSettings.xml")]
)
class ConfigurationSettings :
    SimplePersistentStateComponent<ConfigurationSettingsState>(ConfigurationSettingsState()) {
    companion object {
        @JvmStatic
        fun getState(): ConfigurationSettingsState {
            return service<ConfigurationSettings>().state
        }
    }
}

class ConfigurationSettingsState : BaseState() {
    var checkForPluginUpdates by property(true)
    var chatAutoReferenceSelectedFile by property(true)
    var serverUrl: String? by string("http://localhost:3002/")
    var useCustomServer by property(false)
    var environmentMode: String? by string("auto") // auto, development, production
    var customDevUrl: String? by string("http://localhost:3002/")
    var customProdUrl: String? by string("http://voidmuse/index.html")
}