// Simple i18n implementation
export const translations = {
    en: {
        // Common
        'common.welcome': 'Welcome',
        'common.dashboard': 'Dashboard',
        'common.search': 'Search',
        'common.notifications': 'Notifications',
        'common.bookmarks': 'Bookmarks',
        'common.logout': 'Logout',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.close': 'Close',
        // Navigation
        'nav.work': 'Work',
        'nav.training': 'Training',
        'nav.orientation': 'Orientation',
        'nav.policies': 'Policies',
        'nav.library': 'Library',
        'nav.market': 'Market',
        'nav.templates': 'Templates',
        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.welcome': 'Welcome, {name}!',
        'dashboard.mandatoryTrainings': 'Mandatory Trainings',
        'dashboard.policyCertifications': 'Policy Certifications',
        // Training
        'training.title': 'Training',
        'training.complete': 'Complete mandatory and role-based trainings',
        'training.start': 'Start',
        'training.continue': 'Continue',
        'training.completed': 'Completed',
        'training.inProgress': 'In Progress',
        // Policies
        'policies.title': 'Policies',
        'policies.readCertify': 'Read & Certify',
        'policies.view': 'View',
        // Library
        'library.title': 'Library',
        'library.description': "INARA's knowledge hub and institutional resources",
        // Bookmarks
        'bookmarks.title': 'My Bookmarks',
        'bookmarks.description': 'Your saved resources and favorites',
    },
    ar: {
        // Common
        'common.welcome': 'مرحبا',
        'common.dashboard': 'لوحة التحكم',
        'common.search': 'بحث',
        'common.notifications': 'الإشعارات',
        'common.bookmarks': 'الإشارات المرجعية',
        'common.logout': 'تسجيل الخروج',
        'common.save': 'حفظ',
        'common.cancel': 'إلغاء',
        'common.delete': 'حذف',
        'common.edit': 'تعديل',
        'common.close': 'إغلاق',
        // Navigation
        'nav.work': 'العمل',
        'nav.training': 'التدريب',
        'nav.orientation': 'التوجيه',
        'nav.policies': 'السياسات',
        'nav.library': 'المكتبة',
        'nav.market': 'السوق',
        'nav.templates': 'القوالب',
        // Dashboard
        'dashboard.title': 'لوحة التحكم',
        'dashboard.welcome': 'مرحبا، {name}!',
        'dashboard.mandatoryTrainings': 'التدريبات الإلزامية',
        'dashboard.policyCertifications': 'شهادات السياسات',
        // Training
        'training.title': 'التدريب',
        'training.complete': 'إكمال التدريبات الإلزامية والقائمة على الدور',
        'training.start': 'بدء',
        'training.continue': 'متابعة',
        'training.completed': 'مكتمل',
        'training.inProgress': 'قيد التنفيذ',
        // Policies
        'policies.title': 'السياسات',
        'policies.readCertify': 'قراءة والتأكيد',
        'policies.view': 'عرض',
        // Library
        'library.title': 'المكتبة',
        'library.description': 'مركز المعرفة والموارد المؤسسية لـ INARA',
        // Bookmarks
        'bookmarks.title': 'إشاراتي المرجعية',
        'bookmarks.description': 'مواردك المحفوظة والمفضلة',
    },
};
let currentLanguage = localStorage.getItem('language') || 'en';
export function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
export function getLanguage() {
    return currentLanguage;
}
export function t(key, params) {
    const translation = translations[currentLanguage]?.[key] || translations.en[key] || key;
    if (params) {
        return translation.replace(/\{(\w+)\}/g, (match, param) => params[param] || match);
    }
    return translation;
}
// Initialize
setLanguage(currentLanguage);
