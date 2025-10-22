const urlParams = new URLSearchParams(window.location.search);

export const platform = urlParams.get('platform');

export const getPlatform = () => {
  if (isVscodePlatform()) {
    return 'vscode';
  } else if (isIdeaPlatform()) {
    return 'idea';
  } else {
    return 'web';
  }
};

export const isWebPlatform = () => {
  const result = !isIDEPlatform();
  return result;
};

export const isIDEPlatform = () => {
  return isVscodePlatform() || isIdeaPlatform();
};

export const isVscodePlatform = () => {
  const metas = document.getElementsByTagName('meta')
  const item = metas.namedItem('platform')
  const content = item?.content
  console.log('platform:',content);
  let result = false;
  try {
    result = content === 'vscode';
  } catch (e) {
    result = false;
  }
  return result;
};

export const isIdeaPlatform = () => {
  let result = false;
  try {
    result = typeof  (window as any).callJava === 'function';
  } catch (e) {
    result = false;
  }
  return result;
};

// Add clipboard event handler for VSCode platform
export const initVSCodeClipboardHandler = () => {
  if (isVscodePlatform()) {
    window.addEventListener('keydown', (event) => {
      // Use event.metaKey for Mac, event.ctrlKey for Windows
      if (event.ctrlKey || event.metaKey) {
        switch (event.code) {
          case 'KeyC':
            console.log('vscode copy');
            document.execCommand('copy');
            break;
          case 'KeyX':
            console.log('vscode cut');
            document.execCommand('cut');
            break;
          case 'KeyV':
            console.log('vscode paste');
            document.execCommand('paste');
            break;
          default:
            break;
        }
      }
    });
  }
};

// Add unified copy method
export const copyToClipboard = async (text: string) => {
  if (isVscodePlatform()) {
    // Use execCommand in VSCode environment
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Successfully copied text in VSCode environment');
      return true;
    } catch (err) {
      console.error('Failed to copy text:', err);
      document.body.removeChild(textArea);
      return false;
    }
  } else {
    // Use navigator.clipboard in other environments
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text:', err);
      return false;
    }
  }
};
