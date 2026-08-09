export const COPY = {
  en: {
    kicker: { program: 'PROGRAM', plan: 'WORKOUT' },
    plans: (n) => `${n} plan${n === 1 ? '' : 's'}`,
    exercises: (n) => `${n} exercise${n === 1 ? '' : 's'}`,
    minutes: (n) => (n < 1 ? '< 1 min' : `~${n} min`),
    day: (n) => `Day ${n}`,
    more: (n) => `+${n} more`,
    open: 'Open in Repto',
    noAppAndroid: "Don't have the app? Get Repto on Google Play",
    noAppIos: "Don't have the app? Get Repto on the App Store",
    noAppBoth: "Don't have the app? Get Repto on Google Play",
    getAppStore: 'App Store',
    ogSuffix: { program: 'Workout program on Repto', plan: 'Workout on Repto' },
    notFoundTitle: 'This link has expired',
    notFoundBody: 'The share code no longer exists. Ask for a new link.',
    errorTitle: 'Something went wrong',
    errorBody: 'We could not load this program right now. Please try again later.',
  },
  vi: {
    kicker: { program: 'CHƯƠNG TRÌNH', plan: 'BÀI TẬP' },
    plans: (n) => `${n} kế hoạch`,
    exercises: (n) => `${n} bài tập`,
    minutes: (n) => (n < 1 ? '< 1 phút' : `~${n} phút`),
    day: (n) => `Ngày ${n}`,
    more: (n) => `+${n} bài nữa`,
    open: 'Mở trong Repto',
    noAppAndroid: 'Chưa có app? Tải Repto trên Google Play',
    noAppIos: 'Chưa có app? Tải Repto trên App Store',
    noAppBoth: 'Chưa có app? Tải Repto trên Google Play',
    getAppStore: 'App Store',
    ogSuffix: { program: 'Chương trình tập luyện trên Repto', plan: 'Bài tập trên Repto' },
    notFoundTitle: 'Liên kết này đã hết hạn',
    notFoundBody: 'Mã chia sẻ không còn tồn tại. Hãy xin một liên kết mới.',
    errorTitle: 'Đã xảy ra lỗi',
    errorBody: 'Hiện chưa tải được chương trình này. Vui lòng thử lại sau.',
  },
}

export function pickLocale(request) {
  const header = request.headers.get('accept-language') ?? ''
  return header.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}
