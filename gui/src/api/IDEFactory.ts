import { IDEInterface } from './IDEInterface';
import { VscodeIDE } from './implementations/VscodeIDE';
import { WebIDE } from './implementations/WebIDE';
import { IntelliJIDE } from './implementations/IntelliJDE';
import { isWebPlatform, isVscodePlatform } from '../utils/PlatformUtils';

export class IDEFactory {
  static getIDEImplementation(): IDEInterface {
    if (isVscodePlatform()) {
      return new VscodeIDE();
    } else if (isWebPlatform()) {
      return new WebIDE();
    } else {
      return new IntelliJIDE();
    }
  }
} 