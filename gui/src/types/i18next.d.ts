
import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../i18n/resources/zh-CN/common.json');
      components: typeof import('../i18n/resources/zh-CN/components.json');
      pages: typeof import('../i18n/resources/zh-CN/pages.json');
      errors: typeof import('../i18n/resources/zh-CN/errors.json');
    };
    returnNull: false;
    returnObjects: false;
    // 支持多命名空间数组参数
    allowObjectInHTMLChildren: false;
  }
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../i18n/resources/zh-CN/common.json');
      components: typeof import('../i18n/resources/zh-CN/components.json');
      pages: typeof import('../i18n/resources/zh-CN/pages.json');
      errors: typeof import('../i18n/resources/zh-CN/errors.json');
    };
    returnNull: false;
    returnObjects: false;
    allowObjectInHTMLChildren: false;
  }
}

// 扩展 useTranslation 类型以支持数组参数
declare module 'react-i18next' {
  export function useTranslation<
    Ns extends keyof CustomTypeOptions['resources'] | readonly (keyof CustomTypeOptions['resources'])[]
  >(ns?: Ns): {
    t: TFunction<Ns>;
    i18n: i18n;
    ready: boolean;
  };
}