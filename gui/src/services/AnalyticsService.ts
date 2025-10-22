declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    _hmt: any[];
  }
}

export interface AnalyticsConfig {
  googleAnalyticsId?: string;
  baiduAnalyticsId?: string;
  enableGoogle?: boolean;
  enableBaidu?: boolean;
}

export interface PageViewData {
  page_title?: string;
  page_location?: string;
  page_path?: string;
}

export interface CustomEventData {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: any;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private config: AnalyticsConfig;
  private pageStartTime: number = 0;

  private constructor() {
    this.config = {
      googleAnalyticsId: 'G-0KP7W64S1P',
      baiduAnalyticsId: '93a02f36f43bdea2827e3ca2016dcad1',
      enableGoogle: true,
      enableBaidu: true,
    };
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public init(config?: Partial<AnalyticsConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    console.log('Analytics Service initialized:', {
      google: this.config.enableGoogle && !!this.config.googleAnalyticsId,
      baidu: this.config.enableBaidu && !!this.config.baiduAnalyticsId,
    });
  }

  // Page view tracking
  public trackPageView(data?: PageViewData): void {
    this.pageStartTime = Date.now();
    
    const pageData = {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...data,
    };

    // Google GA4 tracking
    if (this.config.enableGoogle && this.config.googleAnalyticsId && window.gtag) {
      try {
        window.gtag('config', this.config.googleAnalyticsId, {
          page_title: pageData.page_title,
          page_location: pageData.page_location,
        });
        console.log('Google Analytics page view tracked:', pageData);
      } catch (error) {
        console.warn('Google Analytics tracking failed:', error);
      }
    }

    // Baidu Analytics tracking
    if (this.config.enableBaidu && window._hmt) {
      try {
        window._hmt.push(['_trackPageview', pageData.page_path]);
        console.log('Baidu Analytics page view tracked:', pageData);
      } catch (error) {
        console.warn('Baidu Analytics tracking failed:', error);
      }
    }
  }

  // Page leave tracking (calculate stay duration)
  public trackPageLeave(): void {
    if (this.pageStartTime === 0) return;

    const duration = Math.round((Date.now() - this.pageStartTime) / 1000); // seconds
    
    // Google GA4 custom event
    if (this.config.enableGoogle && window.gtag) {
      try {
        window.gtag('event', 'page_duration', {
          event_category: 'engagement',
          event_label: window.location.pathname,
          value: duration,
          custom_parameter_duration_seconds: duration,
        });
        console.log('Google Analytics page duration tracked:', duration, 'seconds');
      } catch (error) {
        console.warn('Google Analytics duration tracking failed:', error);
      }
    }

    // Baidu Analytics custom event
    if (this.config.enableBaidu && window._hmt) {
      try {
        window._hmt.push(['_trackEvent', 'page_engagement', 'duration', window.location.pathname, duration]);
        console.log('Baidu Analytics page duration tracked:', duration, 'seconds');
      } catch (error) {
        console.warn('Baidu Analytics duration tracking failed:', error);
      }
    }

    this.pageStartTime = 0;
  }

  // Custom event tracking
  public trackEvent(eventName: string, data?: CustomEventData): void {
    // Google GA4 event
    if (this.config.enableGoogle && window.gtag) {
      try {
        window.gtag('event', eventName, data);
        console.log('Google Analytics event tracked:', eventName, data);
      } catch (error) {
        console.warn('Google Analytics event tracking failed:', error);
      }
    }

    // Baidu Analytics event
    if (this.config.enableBaidu && window._hmt) {
      try {
        window._hmt.push([
          '_trackEvent',
          data?.event_category || 'custom',
          eventName,
          data?.event_label || '',
          data?.value || 0,
        ]);
        console.log('Baidu Analytics event tracked:', eventName, data);
      } catch (error) {
        console.warn('Baidu Analytics event tracking failed:', error);
      }
    }
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  public isAvailable(): { google: boolean; baidu: boolean } {
    return {
      google: Boolean(this.config.enableGoogle && typeof window.gtag === 'function' && this.config.googleAnalyticsId),
      baidu: Boolean(this.config.enableBaidu && Array.isArray(window._hmt) && this.config.baiduAnalyticsId),
    };
  }
}

export default AnalyticsService;