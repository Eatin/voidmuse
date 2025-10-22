// README
/*
1. 测试相关代码
*/
import { EmbeddingsVectorService, testEmbeddingsDbService, EmbeddingsContent, EmbeddingsQueryResult } from './EmbeddingsVectorService';
import { EmbeddingsFileService, testEmbeddingsFileService } from './EmbeddingsFileService';
import EmbeddingsSettings from './EmbeddingsSettings';
import { isTextFile, isTextString, testEmbeddingsUtils } from './EmbeddingsUtils';

/*
1. 加载文件embeddingsv2.txt，如果文件存在，则执行testEmbeddingsDbService()，否则跳过
*/
export function init() {
    const fs = require('fs');
    const path = require('path');
    const embeddingsv2Path = path.join(__dirname, '..', '..', 'embeddingsv2.json');
    console.log(`${embeddingsv2Path}`);

    testEmbeddingsUtils();

    const embeddingsv2Content = fs.readFileSync(embeddingsv2Path, 'utf8');
    console.log(`${embeddingsv2Content}`);

    const embeddingsv2Json = JSON.parse(embeddingsv2Content);
    console.log(`${JSON.stringify(embeddingsv2Json)}`);

    const model = EmbeddingsSettings.getEnabledEmbeddingModelId();
    console.log(`vvv model: ${model}`);

    // 调试代码，随时可以修改、删除
    if (fs.existsSync(embeddingsv2Path)) {
        // testEmbeddingsDbService().then(result => {
        //     console.log(`Test result: ${result}`);
        // });
    }
}
