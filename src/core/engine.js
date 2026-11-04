export function detectPhoneTier() {
  const ua = navigator.userAgent || '';
  const isPhone = /android|iphone|ipod|ipad|mobile/i.test(ua);
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 6;

  if (isPhone && (memory <= 4 || cores <= 4)) return 'low';
  if (isPhone && (memory <= 6 || cores <= 6)) return 'medium';
  return 'high';
}

export function getLowerQuality(current) {
  const order = ['low', 'medium', 'high', 'ultra'];
  const index = order.indexOf(current);
  return index > 0 ? order[index - 1] : current;
}
