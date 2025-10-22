import axios from 'axios';

export async function getUrlContent(urlString: string): Promise<string> {
    try {
        const response = await axios.get(urlString, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (VS Code Extension)'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(`获取URL内容失败: ${error}`);
    }
}