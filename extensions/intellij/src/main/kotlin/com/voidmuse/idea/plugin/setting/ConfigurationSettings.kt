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

}