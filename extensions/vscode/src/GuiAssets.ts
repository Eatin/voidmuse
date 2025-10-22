import * as fs from 'fs';
import * as path from 'path';

export function getJsFile(dir: string): string | null {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile() && path.extname(file).toLowerCase() === '.js') {
        return file;
      }
    }
  } catch (error) {
    console.error(`Error reading directory: ${error}`);
  }
  return null;
}

export function getCssFile(dir: string): string | null {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile() && path.extname(file).toLowerCase() === '.css') {
        return file;
      }
    }
  } catch (error) {
    console.error(`Error reading directory: ${error}`);
  }
  return null;
}

