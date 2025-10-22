export const base64Decode = (str) => {
    try {
        const bytes = Uint8Array.from(atob(str), char => char.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
    } catch (error) {
        console.error('Base64 decode error:', error);
        return '';
    }
};

export const base64DecodeArray = (strArray) => {
    return strArray.map(str => {
        try {
            const bytes = Uint8Array.from(atob(str), char => char.charCodeAt(0));
            return new TextDecoder('utf-8').decode(bytes);
        } catch (error) {
            console.error('Base64 decode error:', error);
            return '';
        }
    });
};