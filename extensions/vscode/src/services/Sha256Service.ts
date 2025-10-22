import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

class Sha256Service {
    // 读文件，计算sha256
    public getFileSha256(filePath: string): string {
        const data = fs.readFileSync(filePath);
        const sha256 = crypto.createHash('sha256').update(data).digest('hex');
        return sha256;
    }

    // 计算字符串的sha256
    public getStringSha256(str: string): string {
        const sha256 = crypto.createHash('sha256').update(str).digest('hex');
        return sha256;
    }
}

export { Sha256Service };

// 测试执行代码
if (require.main === module) {
    // 获取当前文件的路径
    const currentFilePath = __filename;
    console.log(`测试文件: ${currentFilePath}`);
    
    try {
        // 创建Sha256Service实例
        const sha256Service = new Sha256Service();
        // 计算当前文件的SHA256哈希值
        const sha256Hash = sha256Service.getFileSha256(currentFilePath);
        console.log(`SHA256哈希值: ${sha256Hash}`);
    } catch (error) {
        console.error('测试失败:', error);
    }
}

