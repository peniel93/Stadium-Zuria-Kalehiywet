export type Locale = "en" | "am";

export type Bilingual = {
  en: string;
  am: string;
};

export type QuickStat = {
  label: Bilingual;
  value: string;
};

export type NavItem = {
  key: string;
  label: Bilingual;
  href: string;
};

export type ContentCard = {
  title: Bilingual;
  summary: Bilingual;
  date: string;
  tag: "news" | "announcement" | "vacancy" | "training";
  urgent?: boolean;
};

export const siteTitle: Bilingual = {
  en: "Durame Stadium Zuria Kalehiywet Church Portal",
  am: "ዱራሜ ስታዲየም ዙሪያ ቃለሕይወት ቤተክርስቲያን ፖርታል",
};

export const navItems: NavItem[] = [
  { key: "home", label: { en: "Home", am: "መነሻ" }, href: "/" },
  { key: "about", label: { en: "About", am: "ስለ እኛ" }, href: "/about" },
  {
    key: "services",
    label: { en: "Services", am: "አገልግሎቶች" },
    href: "/services",
  },
  {
    key: "departments",
    label: { en: "Departments", am: "ዘርፎች" },
    href: "/departments",
  },
  {
    key: "contact",
    label: { en: "Contact", am: "አግኙን" },
    href: "/contact",
  },
  {
    key: "resources",
    label: { en: "Resources", am: "ሃብቶች" },
    href: "/resources",
  },
  {
    key: "developer",
    label: { en: "About Developer", am: "ስለ አበልጻጊው" },
    href: "/developer",
  },
];

export const quickStats: QuickStat[] = [
  {
    label: { en: "Church Members", am: "የቤተክርስቲያን አባላት" },
    value: "2,480",
  },
  {
    label: { en: "Church Teams", am: "የቤተክርስቲያን ቡድኖች" },
    value: "24",
  },
  {
    label: { en: "Branch Churches", am: "ቅርንጫፍ አብያተ ክርስቲያናት" },
    value: "7",
  },
  {
    label: { en: "Planted Churches", am: "የተተከሉ አብያተ ክርስቲያናት" },
    value: "13",
  },
  {
    label: { en: "Church Workers", am: "የቤተክርስቲያን ሰራተኞች" },
    value: "96",
  },
];

export const spotlightCards: ContentCard[] = [
  {
    title: {
      en: "Urgent Prayer Night Update",
      am: "የአስቸኳይ የጸሎት ሌሊት ማሻሻያ",
    },
    summary: {
      en: "Tonight's prayer starts at 7:30 PM at Main Hall B.",
      am: "የዛሬ ምሽት ጸሎት በ7:30 በዋና አዳራሽ B ይጀምራል።",
    },
    date: "2026-04-16",
    tag: "announcement",
    urgent: true,
  },
  {
    title: {
      en: "Children Ministry Registration Open",
      am: "የልጆች አገልግሎት ምዝገባ ተከፍቷል",
    },
    summary: {
      en: "New age-group and class assignment forms are now live.",
      am: "አዲስ የእድሜ ቡድን እና ክፍል ምደባ ቅጾች ተከፍተዋል።",
    },
    date: "2026-04-15",
    tag: "news",
  },
  {
    title: {
      en: "Media Team Volunteer Vacancy",
      am: "የሚዲያ ቡድን ተባባሪ የስራ እድል",
    },
    summary: {
      en: "Applications close in 5 days. Use online application form.",
      am: "ማመልከቻ በ5 ቀን ውስጥ ይዘጋል። የመስመር ላይ ቅጽ ይጠቀሙ።",
    },
    date: "2026-04-13",
    tag: "vacancy",
  },
  {
    title: {
      en: "Youth Leadership Training",
      am: "የወጣቶች የአመራር ስልጠና",
    },
    summary: {
      en: "Weekly Saturday leadership training continues this month.",
      am: "የሳምንታዊ ቅዳሜ የአመራር ስልጠና በዚህ ወር ይቀጥላል።",
    },
    date: "2026-04-12",
    tag: "training",
  },
];

export const departments: Bilingual[] = [
  { en: "Medeb Sefer", am: "መደብ ሰፈር" },
  { en: "Kids and Children Service", am: "የልጆች አገልግሎት" },
  { en: "Youth Service", am: "የወጣቶች ዘርፍ" },
  { en: "Women Service", am: "የእናቶች/ሴቶች ዘርፍ" },
  { en: "Worship and Choir Teams", am: "የአምልኮ እና መዝሙር ቡድኖች" },
  { en: "Outreach and Mission", am: "ወንጌል እና ተልዕኮ" },
  { en: "Media and Sound Team", am: "ሚዲያ እና ድምጽ ቡድን" },
  { en: "Administration", am: "አስተዳደር" },
];

export const homeSlides: Array<{ heading: Bilingual; text: Bilingual }> = [
  {
    heading: {
      en: "One Dynamic Portal For Every Department",
      am: "ለሁሉም ዘርፎች አንድ ተለዋዋጭ ፖርታል",
    },
    text: {
      en: "Announcements, trainings, vacancies, and church updates from one coordinated system.",
      am: "ማስታወቂያዎች፣ ስልጠናዎች፣ የስራ እድሎች እና የቤተክርስቲያን ማሻሻያዎች ከአንድ የተደራጀ ስርዓት።",
    },
  },
  {
    heading: {
      en: "Super Admin Plus Department Dashboards",
      am: "ዋና አስተዳዳሪ እና የዘርፍ ዳሽቦርዶች",
    },
    text: {
      en: "Permission-based management to simplify operations and reduce manual overhead.",
      am: "በፈቃድ መቆጣጠሪያ ላይ የተመሰረተ አስተዳደር ሂደቶችን ለማቀላጠፍ እና የእጅ ስራን ለመቀነስ።",
    },
  },
  {
    heading: {
      en: "Web First, Mobile Ready",
      am: "መጀመሪያ ድር ከዚያ ሞባይል ዝግጁ",
    },
    text: {
      en: "Built in React architecture that transitions smoothly to React Native APK builds.",
      am: "በReact አቀማመጥ የተገነባ ስርዓት ወደ React Native APK ግንባታ በቀላሉ ይተላለፋል።",
    },
  },
];
