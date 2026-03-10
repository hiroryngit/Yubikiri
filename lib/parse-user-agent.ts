/** User-Agent文字列からブラウザとOSを抽出する */
export function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = "不明なブラウザ";
  let os = "不明なOS";

  // OS判定
  if (/iPhone/.test(ua)) os = "iPhone";
  else if (/iPad/.test(ua)) os = "iPad";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  else if (/CrOS/.test(ua)) os = "ChromeOS";

  // ブラウザ判定（順序重要: 派生ブラウザを先に判定）
  if (/Edg\/(\d+)/.test(ua)) {
    browser = `Edge ${RegExp.$1}`;
  } else if (/OPR\/(\d+)/.test(ua) || /Opera\/(\d+)/.test(ua)) {
    browser = `Opera ${RegExp.$1}`;
  } else if (/Chrome\/(\d+)/.test(ua) && !/Edg/.test(ua)) {
    browser = `Chrome ${RegExp.$1}`;
  } else if (/Safari\/(\d+)/.test(ua) && !/Chrome/.test(ua)) {
    const match = ua.match(/Version\/(\d+)/);
    browser = match ? `Safari ${match[1]}` : "Safari";
  } else if (/Firefox\/(\d+)/.test(ua)) {
    browser = `Firefox ${RegExp.$1}`;
  }

  return { browser, os };
}
