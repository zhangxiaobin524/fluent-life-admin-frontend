// 監控和錯誤追蹤工具

// Sentry 錯誤追蹤
export const initSentry = (dsn: string, environment: string) => {
  if (!dsn) {
    return;
  }

  // 動態導入 Sentry（避免在開發環境中強制加載）
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: dsn,
      environment: environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // 性能監控採樣率（生產環境建議 0.1，開發環境可以 1.0）
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Session Replay 採樣率
      replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
      // 錯誤重放採樣率
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event) {
        // 過濾敏感信息
        if (event.request) {
          // 移除可能的敏感查詢參數
          if (event.request.url) {
            try {
              const url = new URL(event.request.url);
              url.searchParams.delete('token');
              url.searchParams.delete('password');
              event.request.url = url.toString();
            } catch (e) {
              // 忽略 URL 解析錯誤
            }
          }
        }
        return event;
      },
    });
  }).catch((err) => {
    console.warn('Failed to initialize Sentry:', err);
  });
};

// 設置用戶上下文
export const setSentryUser = (userId: string, username?: string, email?: string) => {
  import('@sentry/react').then((Sentry) => {
    Sentry.setUser({
      id: userId,
      username: username,
      email: email,
    });
  }).catch(() => {
    // 忽略錯誤
  });
};

// 清除用戶上下文
export const clearSentryUser = () => {
  import('@sentry/react').then((Sentry) => {
    Sentry.setUser(null);
  }).catch(() => {
    // 忽略錯誤
  });
};

// 捕獲異常
export const captureException = (error: Error, context?: Record<string, any>) => {
  import('@sentry/react').then((Sentry) => {
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  }).catch(() => {
    // 忽略錯誤
  });
};

// 捕獲消息
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  import('@sentry/react').then((Sentry) => {
    Sentry.captureMessage(message, {
      level: level as any,
    });
  }).catch(() => {
    // 忽略錯誤
  });
};

// Google Analytics 初始化
export const initGoogleAnalytics = (trackingId: string) => {
  if (!trackingId) {
    return;
  }

  // 加載 Google Analytics gtag.js
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script1);

  // 初始化 gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  gtag('js', new Date());
  gtag('config', trackingId, {
    page_path: window.location.pathname,
  });
};

// 追蹤頁面瀏覽
export const trackPageView = (path: string, title?: string) => {
  if ((window as any).gtag) {
    (window as any).gtag('config', (window as any).GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
    });
  }
};

// 追蹤事件
export const trackEvent = (
  eventName: string,
  eventParams?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }
) => {
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams || {});
  }
};
