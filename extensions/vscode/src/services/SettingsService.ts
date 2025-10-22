import { PluginConfig } from '../PluginConfig';
import { Constants } from '../common/Constants';
import axios from 'axios';
import * as vscode from 'vscode';
import * as os from 'os';


const SETTING_CODEBASE_ENABLE_DEFAULT = false;
const SETTING_CODEBASE_MAX_SEARCH_RESULT_DEFAULT = 10;
const SETTING_COMMIT_LANGUAGE_DEFAULT = 'Chinese';
const SETTING_REFERENCE_FILE_DEFAULT = true;
const SETTING_AUTOCOMPLETE_ENABLE_DEFAULT = true;
const SETTING_AUTOCOMPLETE_DELAY_DEFAULT = 500;
const SETTING_AUTOCOMPLETE_MODEL_DEFAULT = 'zhipu';

interface ModelConfig {
    key: string;
    name: string;
    provider: string;
    enabled: boolean;
    modelId: string;
    apiKey: string;
    baseUrl: string;
  }

class SettingsService {

    constructor() {
        this.init();
    }

    private async init() {

        const codeBaseEnable = PluginConfig.get(Constants.SETTING_CODEBASE_ENABLE, undefined);
        if (!codeBaseEnable) {
            await PluginConfig.updateAll({ [Constants.SETTING_CODEBASE_ENABLE]: SETTING_CODEBASE_ENABLE_DEFAULT });
        }

        const codeBaseMaxSearchResult = PluginConfig.get(Constants.SETTING_CODEBASE_MAX_SEARCH_RESULT, undefined);
        if (!codeBaseMaxSearchResult) {
            await PluginConfig.updateAll({ [Constants.SETTING_CODEBASE_MAX_SEARCH_RESULT]: SETTING_CODEBASE_MAX_SEARCH_RESULT_DEFAULT });
        }

        const commitLanguage = PluginConfig.get(Constants.SETTING_COMMIT_LANGUAGE, undefined);
        if (!commitLanguage) {
            await PluginConfig.updateAll({ [Constants.SETTING_COMMIT_LANGUAGE]: SETTING_COMMIT_LANGUAGE_DEFAULT });
        }

        const referenceFile = PluginConfig.get(Constants.SETTING_REFERENCE_FILE, undefined);
        if (!referenceFile) {
            await PluginConfig.updateAll({ [Constants.SETTING_REFERENCE_FILE]: SETTING_REFERENCE_FILE_DEFAULT });
        }

        const env = PluginConfig.get(Constants.ENV, undefined);
        if (!env) {
            await PluginConfig.updateAll({ [Constants.ENV]: Constants.ENV_PROD });
        }

        const autoCompleteEnable = PluginConfig.get(Constants.SETTING_AUTOCOMPLETE_ENABLE, undefined);
        if (!autoCompleteEnable) {
            await PluginConfig.updateAll({ [Constants.SETTING_AUTOCOMPLETE_ENABLE]: SETTING_AUTOCOMPLETE_ENABLE_DEFAULT });
        }

        const autoCompleteDelay = PluginConfig.get(Constants.SETTING_AUTOCOMPLETE_DELAY, undefined);
        if (!autoCompleteDelay) {
            await PluginConfig.updateAll({ [Constants.SETTING_AUTOCOMPLETE_DELAY]: SETTING_AUTOCOMPLETE_DELAY_DEFAULT });
        }

        const autoCompleteModel = PluginConfig.get(Constants.SETTING_AUTOCOMPLETE_MODEL, undefined);
        if (!autoCompleteModel) {
            await PluginConfig.updateAll({ [Constants.SETTING_AUTOCOMPLETE_MODEL]: SETTING_AUTOCOMPLETE_MODEL_DEFAULT });
        }
        
    }

    getSelectedModelBySetting(): string | undefined{
        return PluginConfig.get(Constants.SETTING_SELECTED_MODEL, undefined);
    }

    getSelectedModelsConfig(): ModelConfig | undefined{
        var selectedModel = this.getSelectedModelBySetting();
        var jsonStr = PluginConfig.get(Constants.SETTING_MODELS, '');
        const configs: ModelConfig[] = JSON.parse(jsonStr);
        for(let conf of configs){
            if(conf.key === selectedModel){
                return conf;
            }
        }
    }

    getSelectedModelConfig(): string | undefined{
        return PluginConfig.get(Constants.SETTING_SELECTED_MODEL, undefined);
    }

    getCommitModelListBySetting(): string[] {
        return PluginConfig.get(Constants.SETTING_COMMIT_MODEL_LIST, []);
    }

    getGitCommitModel(): string | undefined {
        return PluginConfig.get(Constants.SETTING_GIT_COMMIT_MODEL, undefined);
    }

    getGitCommitUserInput(): string | undefined {
        return PluginConfig.get(Constants.SETTING_GIT_COMMIT_USERINPUT, undefined);
    }

    getCodeBaseEnable(): boolean {
        return PluginConfig.get(Constants.SETTING_CODEBASE_ENABLE, SETTING_CODEBASE_ENABLE_DEFAULT);
    }

    getcodeBaseMaxSearchResult(): number {
        return PluginConfig.get(Constants.SETTING_CODEBASE_MAX_SEARCH_RESULT, SETTING_CODEBASE_MAX_SEARCH_RESULT_DEFAULT);
    }

    getCommitLanguage(): string {
        return PluginConfig.get(Constants.SETTING_COMMIT_LANGUAGE, SETTING_COMMIT_LANGUAGE_DEFAULT);
    }

    getReferenceFile(): boolean {
        return PluginConfig.get(Constants.SETTING_REFERENCE_FILE, SETTING_REFERENCE_FILE_DEFAULT);
    }

    getAutoCompleteEnable(): boolean {
        return PluginConfig.get(Constants.SETTING_AUTOCOMPLETE_ENABLE, SETTING_AUTOCOMPLETE_ENABLE_DEFAULT);
    }

    getAutoCompleteDelay(): number {
        return PluginConfig.get(Constants.SETTING_AUTOCOMPLETE_DELAY, SETTING_AUTOCOMPLETE_DELAY_DEFAULT);
    }

    getAutoCompleteModel(): string {
        return PluginConfig.get(Constants.SETTING_AUTOCOMPLETE_MODEL, SETTING_AUTOCOMPLETE_MODEL_DEFAULT);
    }

    getEnv(): string {
        return PluginConfig.get(Constants.ENV, Constants.ENV_PROD);
    }

    isDev(): boolean {
        return Constants.ENV_DEV === this.getEnv();
    }

    isTest(): boolean {
        return Constants.ENV_TEST === this.getEnv();
    }

    isProd(): boolean {
        return Constants.ENV_PROD === this.getEnv();
    }

    getSelectedEmbeddingModel(): string{
        return PluginConfig.get(Constants.SETTING_SELECTED_EMBEDDING_MODEL, "");
    }

    getFriendlyOSName(platform:string) {
        switch (platform) {
            case 'win32': return 'Windows';
            case 'darwin': return 'macOS';
            case 'linux': return 'Linux';
            default: return platform;
        }
    }

    getProjectConfig(){
        let theme = "dark";
        const themeKind = vscode.window.activeColorTheme.kind;
        if(themeKind === 1){
            theme = "light";
        }
        console.log("current theme " + theme);

        // 获取当前工作区信息
        const workspaceFolders = vscode.workspace.workspaceFolders;

        let projectName = "";
        let projectPath = "";
        if (workspaceFolders && workspaceFolders.length > 0) {
            // 获取第一个项目的信息（多项目工作区会有多个）
            projectName = workspaceFolders[0].name;
            projectPath = workspaceFolders[0].uri.fsPath;
            
            console.log(`项目名称: ${projectName}`);
            console.log(`项目路径: ${projectPath}`);
            
        } else {
            console.log('没有打开的工作区');
        }

        //获得系统信息
        const platform = this.getFriendlyOSName(os.platform());  // 'win32', 'darwin'(macOS), 'linux'
        const release = os.release();    // 系统版本号
        const arch = os.arch();   
        const systemVision = platform+"|"+release+"|"+arch;
        console.log('系统版本：'+systemVision);

        var config = {
            'projectName':projectName,
            'projectPath': projectPath,
            'systemVision': systemVision,
            'theme': theme,
            'language': vscode.env.language
        };
        return JSON.stringify(config);
    }

}

export default new SettingsService();