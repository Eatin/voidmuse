package com.voidmuse.idea.plugin.activity

import com.intellij.ide.plugins.InstalledPluginsState
import com.intellij.notification.NotificationAction
import com.intellij.notification.NotificationType
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.progress.Task
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.ProjectActivity
import com.intellij.openapi.updateSettings.impl.UpdateChecker.updateAndShowResult
import com.intellij.openapi.updateSettings.impl.UpdateSettings
import com.intellij.util.concurrency.AppExecutorUtil
import com.voidmuse.idea.plugin.VoidMusePlugin
import com.voidmuse.idea.plugin.setting.ConfigurationSettings
import java.util.concurrent.TimeUnit

class CheckUpdateActivity : ProjectActivity {
    val log: Logger = Logger.getInstance(
        CheckUpdateActivity::class.java
    )

    override suspend fun execute(project: Project) {
        if (ApplicationManager.getApplication().isUnitTestMode) {
            return
        }

        schedulePluginUpdateChecks(project)
    }

    private fun schedulePluginUpdateChecks(project: Project) {
        val command = {
            if (service<ConfigurationSettings>().state.checkForPluginUpdates) {
                CheckForUpdatesTask(project).queue()
            }
        }
        AppExecutorUtil.getAppScheduledExecutorService()
            .scheduleWithFixedDelay(command, 0, 1L, TimeUnit.HOURS)
    }

    private class CheckForUpdatesTask(project: Project) :
        Task.Backgroundable(project, "Checking for voidMuse update", true) {
        val log: Logger = Logger.getInstance(CheckForUpdatesTask::class.java)

        override fun run(indicator: ProgressIndicator) {
            val isLatestVersion =
                !InstalledPluginsState.getInstance().hasNewerVersion(VoidMusePlugin.Plugin_ID)
            log.info("CheckForUpdatesTask, isLatestVersion: $isLatestVersion")
            if (project.isDisposed || isLatestVersion) {
                return
            }

            com.voidmuse.idea.plugin.util.OverlayUtil.getDefaultNotification(
                "An update for VoidMuse is available.",
                NotificationType.IDE_UPDATE
            )
                .addAction(
                    NotificationAction.createSimpleExpiring(
                        "Install update"
                    ) {
                        ApplicationManager.getApplication()
                            .executeOnPooledThread { installPluginUpdate(project) }
                    })
                .addAction(
                    NotificationAction.createSimpleExpiring(
                        "Do not show again"
                    ) {
                        service<ConfigurationSettings>().state.checkForPluginUpdates = false
                    })
                .notify(project)
        }

        companion object {
                private fun installPluginUpdate(project: Project) {
                    ApplicationManager.getApplication().executeOnPooledThread {
                        try {
                            val settingsCopy = UpdateSettings()
                            val settingsState = settingsCopy.state
                            settingsState.copyFrom(UpdateSettings.getInstance().state)
                            settingsState.isCheckNeeded = true
                            settingsState.isPluginsCheckNeeded = true
                            settingsState.isShowWhatsNewEditor = true
                            settingsState.isThirdPartyPluginsAllowed = true
                            updateAndShowResult(project, settingsCopy)
                        } catch (e: Exception) {
                            com.voidmuse.idea.plugin.util.OverlayUtil.getDefaultNotification(
                                "更新过程中发生错误: ${e.message}",
                                com.intellij.notification.NotificationType.ERROR
                            ).notify(project)
                        }
                    }
                }
            }
    }
}
