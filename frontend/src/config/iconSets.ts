/**
 * Icon Sets Configuration
 * 
 * Maps menu items to different icon components across multiple icon libraries.
 * Using react-icons to ensure high stability and reliable resolution in Vite.
 */

import React from 'react';

// Lucide Icons (Default - Modern Line Icons)
import * as LucideIcons from 'lucide-react';

// Using react-icons for high stability and better Vite resolution
import * as Hi2 from 'react-icons/hi2'; // Heroicons v2
import * as Pi from 'react-icons/pi';   // Phosphor Icons
import * as Tb from 'react-icons/tb';   // Tabler Icons
import * as Md from 'react-icons/md';   // Material Icons
import * as Fa from 'react-icons/fa';   // FontAwesome (react-icons)
import * as Bs from 'react-icons/bs';   // Bootstrap Icons
import * as Ri from 'react-icons/ri';   // Remix Icons
import * as Bi from 'react-icons/bi';   // BoxIcons (via react-icons)
import * as Gi from 'react-icons/gi';   // Game Icons
import * as Ci from 'react-icons/ci';   // Circum Icons
import * as Io5 from 'react-icons/io5'; // Ionicons v5
import * as Si from 'react-icons/si';   // Simple Icons (brands)
import * as Cg from 'react-icons/cg';   // CSS.gg / decorative
import * as Md5 from 'react-icons/md';  // additional material icons (for colorful picks)

// Additional icon libraries (registered for selection)
import * as AntdIcons from '@ant-design/icons';
import * as Feather from 'react-feather';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as FaSolid from '@fortawesome/free-solid-svg-icons';
import * as FaRegular from '@fortawesome/free-regular-svg-icons';
import * as BoxIcons from 'boxicons';
import * as SimpleIcons from 'simple-icons';
import * as Ionicons from 'ionicons';
import * as EvaIcons from 'eva-icons';
import * as Ai from 'react-icons/ai'; // Ant Design icons via react-icons

// Define the icon keys used in the sidebar
export type IconKey =
    | 'dashboard'
    | 'users'
    | 'graduationCap'
    | 'bookOpen'
    | 'calendar'
    | 'dollarSign'
    | 'package'
    | 'briefcase'
    | 'trendingUp'
    | 'messageSquare'
    | 'settings'
    | 'chevronDown'
    | 'chevronRight'
    | 'userPlus'
    | 'list'
    | 'messageCircle'
    | 'folderOpen'
    | 'userCheck'
    | 'calendarDays'
    | 'penTool'
    | 'fileText'
    | 'barChart'
    | 'video'
    | 'camera'
    | 'library'
    | 'clipboardCheck'
    | 'pieChart'
    | 'creditCard'
    | 'settingsGear'
    | 'alertTriangle'
    | 'trendingDown'
    | 'truck'
    | 'home'
    | 'shoppingCart'
    | 'leaf'
    | 'fileSpreadsheet'
    | 'rocket'
    | 'bell'
    | 'helpCircle'
    | 'award'
    | 'layoutTemplate'
    | 'globe'
    | 'shield'
    | 'building'
    | 'utensils'
    | 'shieldCheck'
    | 'ticket'
    | 'receipt'
    | 'landmark'
    | 'fileCheck'
    | 'heart'
    | 'sunrise'
    | 'activity'
    | 'palette'
    | 'history'
    | 'qrCode'
    | 'database';

// Icon Set Types
export type IconSetType =
    | 'lucide'           // Modern line icons (default)
    | 'heroicons_outline' // Clean minimal outlines
    | 'heroicons_solid'   // Clean minimal solid
    | 'phosphor_regular'  // Versatile regular weight
    | 'phosphor_bold'     // Versatile bold weight
    | 'phosphor_fill'     // Versatile filled icons
    | 'tabler'           // Consistent stroke icons
    | 'material_outlined' // Material Design outlined
    | 'ant_design'
    | 'feather'
    | 'fontawesome_solid'
    | 'fontawesome_regular'
    | 'boxicons'
    | 'simple_icons'
    | 'ionicons'
    | 'eva_icons'
    | 'bootstrap'
    | 'remix'
    | 'boxicons_react'
    | 'fontawesome_react'
    | 'game_icons'
    | 'ionicons_react'
    | 'simple_icons_react';
    
// Include fun sets in IconSetType
export type IconSetTypeExtended = IconSetType | 'fun_neon' | 'fun_pastel' | 'fun_cartoon' | 'fun_emoji';
    
// Add fun sets to IconSetType (string literal union extension)
export type FunIconSetType = 'fun_neon' | 'fun_pastel' | 'fun_cartoon' | 'fun_emoji';

export interface IconSetInfo {
    id: IconSetType;
    name: string;
    description: string;
    previewIcons: IconKey[];
}

// Icon Set Metadata
export const iconSetInfo: Record<IconSetType, IconSetInfo> = {
    lucide: {
        id: 'lucide',
        name: 'Modern Line',
        description: 'Clean, modern line icons with consistent stroke width',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    heroicons_outline: {
        id: 'heroicons_outline',
        name: 'Heroicons Outline',
        description: 'Minimal outlined icons by Tailwind CSS creators',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    heroicons_solid: {
        id: 'heroicons_solid',
        name: 'Heroicons Solid',
        description: 'Minimal solid filled icons by Tailwind CSS creators',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    phosphor_regular: {
        id: 'phosphor_regular',
        name: 'Phosphor Regular',
        description: 'Flexible icons with regular weight, playful yet professional',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    phosphor_bold: {
        id: 'phosphor_bold',
        name: 'Phosphor Bold',
        description: 'Bold weight icons for strong visual presence',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    phosphor_fill: {
        id: 'phosphor_fill',
        name: 'Phosphor Fill',
        description: 'Filled solid icons for a more prominent look',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    tabler: {
        id: 'tabler',
        name: 'Tabler Icons',
        description: 'Over 1800 consistent stroke-based icons',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    material_outlined: {
        id: 'material_outlined',
        name: 'Material Outlined',
        description: 'Google Material Design outlined style icons',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    }
    ,
    bootstrap: {
        id: 'bootstrap',
        name: 'Bootstrap Icons',
        description: 'Clean, geometric icons from Bootstrap Icons (via react-icons/bs)',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    remix: {
        id: 'remix',
        name: 'Remix Icons',
        description: 'Remix icon set for modern interfaces (via react-icons/ri)',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    boxicons_react: {
        id: 'boxicons_react',
        name: 'Boxicons (React)',
        description: 'Boxicons via react-icons/bi for a playful UI style',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    fontawesome_react: {
        id: 'fontawesome_react',
        name: 'Font Awesome (React)',
        description: 'Font Awesome icons via react-icons/fa for broader variety',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    game_icons: {
        id: 'game_icons',
        name: 'Game Icons',
        description: 'Decorative and expressive icons (via react-icons/gi)',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    ionicons_react: {
        id: 'ionicons_react',
        name: 'Ionicons (React)',
        description: 'Ionicons via react-icons/io5 for sharp glyphs',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    simple_icons_react: {
        id: 'simple_icons_react',
        name: 'Simple Icons (Brands)',
        description: 'Brand-focused icons via react-icons/si',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    fun_neon: {
        id: 'fun_neon',
        name: 'Fun Neon',
        description: 'Bright neon-style icons with energetic shapes',
        previewIcons: ['dashboard', 'bookOpen', 'calendar', 'bell']
    },
    fun_pastel: {
        id: 'fun_pastel',
        name: 'Playful Pastel',
        description: 'Soft pastel icons with friendly shapes',
        previewIcons: ['dashboard', 'bookOpen', 'calendar', 'bell']
    },
    fun_cartoon: {
        id: 'fun_cartoon',
        name: 'Cartoonish',
        description: 'Whimsical cartoon-style icons (bold, rounded)',
        previewIcons: ['dashboard', 'bookOpen', 'calendar', 'bell']
    },
    fun_emoji: {
        id: 'fun_emoji',
        name: 'Emoji Style',
        description: 'Emoji-like glyphs for a playful experience',
        previewIcons: ['dashboard', 'bookOpen', 'calendar', 'bell']
    },
    
    ant_design: {
        id: 'ant_design',
        name: 'Ant Design',
        description: 'Ant Design icon pack (outlined and filled variants)',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    feather: {
        id: 'feather',
        name: 'Feather Icons',
        description: 'Simple open-source icons (React Feather)',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    fontawesome_solid: {
        id: 'fontawesome_solid',
        name: 'Font Awesome (Solid)',
        description: 'Font Awesome solid style icons',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    fontawesome_regular: {
        id: 'fontawesome_regular',
        name: 'Font Awesome (Regular)',
        description: 'Font Awesome regular style icons',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    boxicons: {
        id: 'boxicons',
        name: 'Boxicons',
        description: 'Boxicons SVG icon set',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    simple_icons: {
        id: 'simple_icons',
        name: 'Simple Icons',
        description: 'Simple brand icons collection',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    ionicons: {
        id: 'ionicons',
        name: 'Ionicons',
        description: 'Ionicons (Ionic icons)',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    },
    eva_icons: {
        id: 'eva_icons',
        name: 'Eva Icons',
        description: 'Eva icon pack (SVG based)',
        previewIcons: ['dashboard', 'users', 'settings', 'bell']
    }
};

// Create component wrappers for each library
type IconComponent = React.ComponentType<any>;

// Lucide Icons Mapping
const lucideIcons: Record<IconKey, IconComponent> = {
    dashboard: LucideIcons.LayoutDashboard,
    users: LucideIcons.Users,
    graduationCap: LucideIcons.GraduationCap,
    bookOpen: LucideIcons.BookOpen,
    calendar: LucideIcons.Calendar,
    dollarSign: LucideIcons.DollarSign,
    package: LucideIcons.Package,
    briefcase: LucideIcons.Briefcase,
    trendingUp: LucideIcons.TrendingUp,
    messageSquare: LucideIcons.MessageSquare,
    settings: LucideIcons.Settings,
    chevronDown: LucideIcons.ChevronDown,
    chevronRight: LucideIcons.ChevronRight,
    userPlus: LucideIcons.UserPlus,
    list: LucideIcons.List,
    messageCircle: LucideIcons.MessageCircle,
    folderOpen: LucideIcons.FolderOpen,
    userCheck: LucideIcons.UserCheck,
    calendarDays: LucideIcons.CalendarDays,
    penTool: LucideIcons.PenTool,
    fileText: LucideIcons.FileText,
    barChart: LucideIcons.BarChart3,
    video: LucideIcons.Video,
    camera: LucideIcons.Camera,
    library: LucideIcons.Library,
    clipboardCheck: LucideIcons.ClipboardCheck,
    pieChart: LucideIcons.PieChart,
    creditCard: LucideIcons.CreditCard,
    settingsGear: LucideIcons.Settings,
    alertTriangle: LucideIcons.AlertTriangle,
    trendingDown: LucideIcons.TrendingDown,
    truck: LucideIcons.Truck,
    home: LucideIcons.Home,
    shoppingCart: LucideIcons.ShoppingCart,
    leaf: LucideIcons.Leaf,
    fileSpreadsheet: LucideIcons.FileSpreadsheet,
    rocket: LucideIcons.Rocket,
    bell: LucideIcons.Bell,
    helpCircle: LucideIcons.HelpCircle,
    award: LucideIcons.Award,
    layoutTemplate: LucideIcons.LayoutTemplate,
    globe: LucideIcons.Globe,
    shield: LucideIcons.Shield,
    building: LucideIcons.Building2,
    utensils: LucideIcons.Utensils,
    shieldCheck: LucideIcons.ShieldCheck,
    ticket: LucideIcons.Ticket,
    receipt: LucideIcons.Receipt,
    landmark: LucideIcons.Landmark,
    fileCheck: LucideIcons.FileCheck,
    heart: LucideIcons.Heart,
    sunrise: LucideIcons.Sunrise,
    activity: LucideIcons.Activity,
    palette: LucideIcons.Palette,
    history: LucideIcons.History,
    qrCode: LucideIcons.QrCode,
    database: LucideIcons.Database,
};

// Heroicons (Outline) Mapping via Hi2
const heroiconsOutlineIcons: Record<IconKey, IconComponent> = {
    dashboard: Hi2.HiOutlineSquares2X2,
    users: Hi2.HiOutlineUsers,
    graduationCap: Hi2.HiOutlineAcademicCap,
    bookOpen: Hi2.HiOutlineBookOpen,
    calendar: Hi2.HiOutlineCalendar,
    dollarSign: Hi2.HiOutlineCurrencyDollar,
    package: Hi2.HiOutlineCube,
    briefcase: Hi2.HiOutlineBriefcase,
    trendingUp: Hi2.HiOutlineArrowTrendingUp,
    messageSquare: Hi2.HiOutlineChatBubbleLeftRight,
    settings: Hi2.HiOutlineCog6Tooth,
    chevronDown: Hi2.HiOutlineChevronDown,
    chevronRight: Hi2.HiOutlineChevronRight,
    userPlus: Hi2.HiOutlineUserPlus,
    list: Hi2.HiOutlineBars3,
    messageCircle: Hi2.HiOutlineChatBubbleOvalLeft,
    folderOpen: Hi2.HiOutlineFolderOpen,
    userCheck: Hi2.HiOutlineUser,
    calendarDays: Hi2.HiOutlineCalendarDays,
    penTool: Hi2.HiOutlinePencil,
    fileText: Hi2.HiOutlineDocumentText,
    barChart: Hi2.HiOutlineChartBar,
    video: Hi2.HiOutlineVideoCamera,
    camera: Hi2.HiOutlineCamera,
    library: Hi2.HiOutlineBuildingLibrary,
    clipboardCheck: Hi2.HiOutlineClipboardDocumentCheck,
    pieChart: Hi2.HiOutlineChartPie,
    creditCard: Hi2.HiOutlineCreditCard,
    settingsGear: Hi2.HiOutlineCog8Tooth,
    alertTriangle: Hi2.HiOutlineExclamationTriangle,
    trendingDown: Hi2.HiOutlineArrowTrendingDown,
    truck: Hi2.HiOutlineTruck,
    home: Hi2.HiOutlineHome,
    shoppingCart: Hi2.HiOutlineShoppingCart,
    leaf: Hi2.HiOutlineSparkles,
    fileSpreadsheet: Hi2.HiOutlineTableCells,
    rocket: Hi2.HiOutlineRocketLaunch,
    bell: Hi2.HiOutlineBell,
    helpCircle: Hi2.HiOutlineQuestionMarkCircle,
    award: Hi2.HiOutlineTrophy,
    layoutTemplate: Hi2.HiOutlineRectangleGroup,
    globe: Hi2.HiOutlineGlobeAlt,
    shield: Hi2.HiOutlineShieldCheck,
    building: Hi2.HiOutlineBuildingOffice,
    utensils: Hi2.HiOutlineBeaker,
    shieldCheck: Hi2.HiOutlineShieldCheck,
    ticket: Hi2.HiOutlineTicket,
    receipt: Hi2.HiOutlineReceiptPercent,
    landmark: Hi2.HiOutlineBuildingLibrary,
    fileCheck: Hi2.HiOutlineDocumentCheck,
    heart: Hi2.HiOutlineHeart,
    sunrise: Hi2.HiOutlineSun,
    activity: Hi2.HiOutlineBolt,
    palette: Hi2.HiOutlineSwatch,
    history: Hi2.HiOutlineClock,
    qrCode: Hi2.HiOutlineQrCode,
    database: Hi2.HiOutlineCircleStack,
};

// Heroicons (Solid) Mapping via Hi2
const heroiconsSolidIcons: Record<IconKey, IconComponent> = {
    dashboard: Hi2.HiSquares2X2,
    users: Hi2.HiUsers,
    graduationCap: Hi2.HiAcademicCap,
    bookOpen: Hi2.HiBookOpen,
    calendar: Hi2.HiCalendar,
    dollarSign: Hi2.HiCurrencyDollar,
    package: Hi2.HiCube,
    briefcase: Hi2.HiBriefcase,
    trendingUp: Hi2.HiArrowTrendingUp,
    messageSquare: Hi2.HiChatBubbleLeftRight,
    settings: Hi2.HiCog6Tooth,
    chevronDown: Hi2.HiChevronDown,
    chevronRight: Hi2.HiChevronRight,
    userPlus: Hi2.HiUserPlus,
    list: Hi2.HiBars3,
    messageCircle: Hi2.HiChatBubbleOvalLeft,
    folderOpen: Hi2.HiFolderOpen,
    userCheck: Hi2.HiUser,
    calendarDays: Hi2.HiCalendarDays,
    penTool: Hi2.HiPencil,
    fileText: Hi2.HiDocumentText,
    barChart: Hi2.HiChartBar,
    video: Hi2.HiVideoCamera,
    camera: Hi2.HiCamera,
    library: Hi2.HiBuildingLibrary,
    clipboardCheck: Hi2.HiClipboardDocumentCheck,
    pieChart: Hi2.HiChartPie,
    creditCard: Hi2.HiCreditCard,
    settingsGear: Hi2.HiCog8Tooth,
    alertTriangle: Hi2.HiExclamationTriangle,
    trendingDown: Hi2.HiArrowTrendingDown,
    truck: Hi2.HiTruck,
    home: Hi2.HiHome,
    shoppingCart: Hi2.HiShoppingCart,
    leaf: Hi2.HiSparkles,
    fileSpreadsheet: Hi2.HiTableCells,
    rocket: Hi2.HiRocketLaunch,
    bell: Hi2.HiBell,
    helpCircle: Hi2.HiQuestionMarkCircle,
    award: Hi2.HiTrophy,
    layoutTemplate: Hi2.HiRectangleGroup,
    globe: Hi2.HiGlobeAlt,
    shield: Hi2.HiShieldCheck,
    building: Hi2.HiBuildingOffice,
    utensils: Hi2.HiBeaker,
    shieldCheck: Hi2.HiShieldCheck,
    ticket: Hi2.HiTicket,
    receipt: Hi2.HiReceiptPercent,
    landmark: Hi2.HiBuildingLibrary,
    fileCheck: Hi2.HiDocumentCheck,
    heart: Hi2.HiHeart,
    sunrise: Hi2.HiSun,
    activity: Hi2.HiBolt,
    palette: Hi2.HiSwatch,
    history: Hi2.HiClock,
    qrCode: Hi2.HiQrCode,
    database: Hi2.HiCircleStack,
};

// Phosphor Icons Mapping via Pi
const phosphorIcons: Record<IconKey, IconComponent> = {
    dashboard: Pi.PiSquaresFour,
    users: Pi.PiUsers,
    graduationCap: Pi.PiGraduationCap,
    bookOpen: Pi.PiBookOpen,
    calendar: Pi.PiCalendar,
    dollarSign: Pi.PiCurrencyDollar,
    package: Pi.PiPackage,
    briefcase: Pi.PiBriefcase,
    trendingUp: Pi.PiTrendUp,
    messageSquare: Pi.PiChatCircle,
    settings: Pi.PiGear,
    chevronDown: Pi.PiCaretDown,
    chevronRight: Pi.PiCaretRight,
    userPlus: Pi.PiUserPlus,
    list: Pi.PiList,
    messageCircle: Pi.PiChatDots,
    folderOpen: Pi.PiFolderOpen,
    userCheck: Pi.PiUserCheck,
    calendarDays: Pi.PiCalendarBlank,
    penTool: Pi.PiPencilSimple,
    fileText: Pi.PiFileText,
    barChart: Pi.PiChartBar,
    video: Pi.PiVideoCamera,
    camera: Pi.PiCamera,
    library: Pi.PiBooks,
    clipboardCheck: Pi.PiClipboardText,
    pieChart: Pi.PiChartPie,
    creditCard: Pi.PiCreditCard,
    settingsGear: Pi.PiGearSix,
    alertTriangle: Pi.PiWarning,
    trendingDown: Pi.PiTrendDown,
    truck: Pi.PiTruck,
    home: Pi.PiHouse,
    shoppingCart: Pi.PiShoppingCart,
    leaf: Pi.PiLeaf,
    fileSpreadsheet: Pi.PiTable,
    rocket: Pi.PiRocket,
    bell: Pi.PiBell,
    helpCircle: Pi.PiQuestion,
    award: Pi.PiTrophy,
    layoutTemplate: Pi.PiLayout,
    globe: Pi.PiGlobe,
    shield: Pi.PiShield,
    building: Pi.PiBuilding,
    utensils: Pi.PiForkKnife,
    shieldCheck: Pi.PiShieldCheck,
    ticket: Pi.PiTicket,
    receipt: Pi.PiReceipt,
    landmark: Pi.PiBank,
    fileCheck: Pi.PiFileText,
    heart: Pi.PiHeart,
    sunrise: Pi.PiSun,
    activity: Pi.PiPulse,
    palette: Pi.PiPalette,
    history: Pi.PiClockCounterClockwise,
    qrCode: Pi.PiQrCode,
    database: Pi.PiDatabase,
};

// Tabler Icons Mapping via Tb
const tablerIcons: Record<IconKey, IconComponent> = {
    dashboard: Tb.TbLayoutDashboard,
    users: Tb.TbUsers,
    graduationCap: Tb.TbSchool,
    bookOpen: Tb.TbBook,
    calendar: Tb.TbCalendar,
    dollarSign: Tb.TbCurrencyDollar,
    package: Tb.TbPackage,
    briefcase: Tb.TbBriefcase,
    trendingUp: Tb.TbTrendingUp,
    messageSquare: Tb.TbMessage,
    settings: Tb.TbSettings,
    chevronDown: Tb.TbChevronDown,
    chevronRight: Tb.TbChevronRight,
    userPlus: Tb.TbUserPlus,
    list: Tb.TbList,
    messageCircle: Tb.TbMessageCircle,
    folderOpen: Tb.TbFolderOpen,
    userCheck: Tb.TbUserCheck,
    calendarDays: Tb.TbCalendarEvent,
    penTool: Tb.TbPencil,
    fileText: Tb.TbFileText,
    barChart: Tb.TbChartBar,
    video: Tb.TbVideo,
    camera: Tb.TbCamera,
    library: Tb.TbBooks,
    clipboardCheck: Tb.TbClipboardCheck,
    pieChart: Tb.TbChartPie,
    creditCard: Tb.TbCreditCard,
    settingsGear: Tb.TbSettingsAutomation,
    alertTriangle: Tb.TbAlertTriangle,
    trendingDown: Tb.TbTrendingDown,
    truck: Tb.TbTruck,
    home: Tb.TbHome,
    shoppingCart: Tb.TbShoppingCart,
    leaf: Tb.TbLeaf,
    fileSpreadsheet: Tb.TbFileSpreadsheet,
    rocket: Tb.TbRocket,
    bell: Tb.TbBell,
    helpCircle: Tb.TbHelpCircle,
    award: Tb.TbAward,
    layoutTemplate: Tb.TbLayout,
    globe: Tb.TbWorld,
    shield: Tb.TbShield,
    building: Tb.TbBuilding,
    utensils: Tb.TbToolsKitchen2,
    shieldCheck: Tb.TbShieldCheck,
    ticket: Tb.TbTicket,
    receipt: Tb.TbReceipt,
    landmark: Tb.TbBuildingBank,
    fileCheck: Tb.TbFileCheck,
    heart: Tb.TbHeart,
    sunrise: Tb.TbSunrise,
    activity: Tb.TbActivity,
    palette: Tb.TbPalette,
    history: Tb.TbHistory,
    qrCode: Tb.TbQrcode,
    database: Tb.TbDatabase,
};

// Material Icons (Outlined) Mapping via Md (fallback to lucide for missing icons)
const materialIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Md.MdOutlineDashboard,
    users: Md.MdOutlinePeople,
    graduationCap: Md.MdOutlineSchool,
    bookOpen: Md.MdOutlineMenuBook,
    calendar: Md.MdOutlineCalendarToday,
    dollarSign: Md.MdOutlineAttachMoney,
    package: Md.MdOutlineInventory2,
    briefcase: Md.MdOutlineWorkOutline,
    trendingUp: Md.MdOutlineTrendingUp,
    messageSquare: Md.MdOutlineMessage,
    settings: Md.MdOutlineSettings,
    chevronDown: Md.MdOutlineExpandMore,
    chevronRight: Md.MdOutlineChevronRight,
    userPlus: Md.MdOutlinePersonAddAlt,
    list: Md.MdOutlineFormatListBulleted,
    messageCircle: Md.MdOutlineChatBubbleOutline,
    folderOpen: Md.MdOutlineFolderOpen,
    userCheck: Md.MdOutlinePerson,
    calendarDays: Md.MdOutlineCalendarMonth,
    penTool: Md.MdOutlineEdit,
    fileText: Md.MdOutlineDescription,
    barChart: Md.MdOutlineBarChart,
    video: Md.MdOutlineVideocam,
    camera: Md.MdOutlinePhotoCamera,
    library: Md.MdOutlineLocalLibrary,
    clipboardCheck: Md.MdOutlineAssignmentTurnedIn,
    pieChart: Md.MdOutlinePieChart,
    creditCard: Md.MdOutlineCreditCard,
    settingsGear: Md.MdOutlineSettings,
    alertTriangle: Md.MdOutlineWarningAmber,
    trendingDown: Md.MdOutlineTrendingDown,
    truck: Md.MdOutlineLocalShipping,
    home: Md.MdOutlineHome,
    shoppingCart: Md.MdOutlineShoppingCart,
    leaf: Md.MdOutlineEco,
    fileSpreadsheet: Md.MdOutlineTableChart,
    rocket: Md.MdOutlineRocketLaunch,
    bell: Md.MdOutlineNotifications,
    helpCircle: Md.MdOutlineHelpOutline,
    award: Md.MdOutlineEmojiEvents,
    layoutTemplate: Md.MdOutlineViewQuilt,
    globe: Md.MdOutlinePublic,
    shield: Md.MdOutlineSecurity,
    building: Md.MdOutlineBusiness,
    utensils: Md.MdOutlineRestaurant,
    shieldCheck: Md.MdOutlineVerifiedUser,
    ticket: Md.MdOutlineConfirmationNumber,
    receipt: Md.MdOutlineReceipt,
    landmark: Md.MdOutlineAccountBalance,
    fileCheck: Md.MdOutlineFactCheck,
    heart: Md.MdOutlineFavoriteBorder,
    sunrise: Md.MdOutlineWbSunny,
    activity: Md.MdOutlineTimeline,
    palette: Md.MdOutlinePalette,
    history: Md.MdOutlineHistory,
    qrCode: Md.MdOutlineQrCode,
    database: Md.MdOutlineStorage,
};

// Additional react-icons backed mappings (merge with lucide for full coverage)
const bootstrapIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Bs.BsColumnsGap,
    users: Bs.BsPeople,
    graduationCap: Bs.BsMortarboard,
    bookOpen: Bs.BsBook,
    calendar: Bs.BsCalendar,
    dollarSign: Bs.BsCurrencyDollar,
    package: Bs.BsBoxSeam,
    briefcase: Bs.BsBriefcase,
    trendingUp: Bs.BsGraphUp,
    messageSquare: Bs.BsChatSquareDots,
    settings: Bs.BsGear,
    chevronDown: Bs.BsChevronDown,
    chevronRight: Bs.BsChevronRight,
    userPlus: Bs.BsPersonPlus,
    list: Bs.BsList,
    messageCircle: Bs.BsChatDots,
    folderOpen: Bs.BsFolder2Open,
    bell: Bs.BsBell,
};

const remixIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Ri.RiDashboardLine,
    users: Ri.RiUser3Line,
    graduationCap: Ri.RiGraduationCapLine,
    bookOpen: Ri.RiBookOpenLine,
    calendar: Ri.RiCalendarLine,
    dollarSign: Ri.RiMoneyDollarCircleLine,
    package: Ri.RiPackageLine,
    briefcase: Ri.RiBriefcaseLine,
    trendingUp: Ri.RiLineChartLine,
    messageSquare: Ri.RiChat4Line,
    settings: Ri.RiSettings3Line,
    chevronDown: Ri.RiArrowDownSLine,
    chevronRight: Ri.RiArrowRightSLine,
    userPlus: Ri.RiUserAddLine,
    list: Ri.RiMenuLine,
    messageCircle: Ri.RiChat1Line,
    folderOpen: Ri.RiFolderOpenLine,
    bell: Ri.RiNotificationLine,
};

const boxiconsReactIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Bi.BiGridAlt,
    users: Bi.BiUser,
    graduationCap: Bi.BiBookAlt,
    bookOpen: Bi.BiBookOpen,
    calendar: Bi.BiCalendar,
    dollarSign: Bi.BiDollar,
    package: Bi.BiPackage,
    briefcase: Bi.BiBriefcase,
    trendingUp: Bi.BiTrendingUp,
    messageSquare: Bi.BiMessageSquare,
    settings: Bi.BiCog,
    chevronDown: Bi.BiChevronsDown,
    chevronRight: Bi.BiChevronRight,
    userPlus: Bi.BiUserPlus,
    list: Bi.BiListUl,
    messageCircle: Bi.BiMessageRoundedDots,
    folderOpen: Bi.BiFolderOpen,
    bell: Bi.BiBell,
};

const fontawesomeReactIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Fa.FaTachometerAlt,
    users: Fa.FaUsers,
    graduationCap: Fa.FaGraduationCap,
    bookOpen: Fa.FaBookOpen,
    calendar: Fa.FaCalendarAlt,
    dollarSign: Fa.FaDollarSign,
    package: Fa.FaBoxOpen,
    briefcase: Fa.FaBriefcase,
    trendingUp: Fa.FaChartLine,
    messageSquare: Fa.FaComments,
    settings: Fa.FaCog,
    chevronDown: Fa.FaChevronDown,
    chevronRight: Fa.FaChevronRight,
    userPlus: Fa.FaUserPlus,
    list: Fa.FaListUl,
    messageCircle: Fa.FaCommentDots,
    folderOpen: Fa.FaFolderOpen,
    bell: Fa.FaBell,
};

const gameIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Gi.GiAbstract050,
    users: Gi.GiTeamIdea,
    graduationCap: Gi.GiLaurelsTrophy,
    bookOpen: Gi.GiOpenBook,
    calendar: Gi.GiCalendar,
    dollarSign: Gi.GiReceiveMoney,
    package: Gi.GiPackage,
    briefcase: Gi.GiSuitcase,
    trendingUp: Gi.GiChart,
    messageSquare: Gi.GiChatBubble,
    settings: Gi.GiCog,
    chevronDown: Gi.GiChevronDown,
    chevronRight: Gi.GiChevronRight,
    userPlus: Gi.GiGroupAdd,
    list: Gi.GiNotebook,
    messageCircle: Gi.GiConversation,
    folderOpen: Gi.GiFolderOpen,
    bell: Gi.GiBell,
};

const ioniconsReactIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Io5.IoGridOutline,
    users: Io5.IoPeopleOutline,
    graduationCap: Io5.IoSchoolOutline,
    bookOpen: Io5.IoBookOutline,
    calendar: Io5.IoCalendarClearOutline,
    dollarSign: Io5.IoCashOutline,
    package: Io5.IoCubeOutline,
    briefcase: Io5.IoBriefcaseOutline,
    trendingUp: Io5.IoTrendingUpOutline,
    messageSquare: Io5.IoChatbubbleEllipsesOutline,
    settings: Io5.IoSettingsOutline,
    chevronDown: Io5.IoChevronDownOutline,
    chevronRight: Io5.IoChevronForwardOutline,
    userPlus: Io5.IoPersonAddOutline,
    list: Io5.IoListOutline,
    messageCircle: Io5.IoChatbubbleOutline,
    folderOpen: Io5.IoFolderOpenOutline,
    bell: Io5.IoNotificationsOutline,
};

const simpleIconsReactIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Si.SiDatadog,
    users: Si.SiLinkedin,
    graduationCap: Si.SiGoogleclassroom,
    bookOpen: Si.SiBookstack,
    calendar: Si.SiGooglecalendar,
    dollarSign: Si.SiStripe,
    package: Si.SiAmazon,
    briefcase: Si.SiMicrosoft,
    trendingUp: Si.SiGoogleanalytics,
    messageSquare: Si.SiSlack,
    settings: Si.SiGithub,
    chevronDown: Si.SiChevron,
    chevronRight: Si.SiChevron,
    userPlus: Si.SiOkta,
    list: Si.SiNotion,
    messageCircle: Si.SiDiscord,
    folderOpen: Si.SiDropbox,
    bell: Si.SiRss,
};

// Fun / colorful icon sets — use a mix of playful icon packs
const funNeonIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Fa.FaBolt,
    bookOpen: Fa.FaBookOpen || Fa.FaBook,
    calendar: Fa.FaCalendarAlt,
    dollarSign: Fa.FaDollarSign,
    package: Fa.FaBoxOpen || Fa.FaBox,
    briefcase: Fa.FaBriefcase,
    trendingUp: Fa.FaChartLine,
    messageSquare: Fa.FaComments,
    settings: Fa.FaCog,
    bell: Fa.FaBell,
};

const funPastelIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Bi.BiGridAlt,
    bookOpen: Bi.BiBookOpen,
    calendar: Bi.BiCalendar,
    dollarSign: Bi.BiDollar,
    package: Bi.BiPackage,
    briefcase: Bi.BiBriefcase,
    trendingUp: Bi.BiTrendingUp,
    messageSquare: Bi.BiMessageSquare,
    settings: Bi.BiCog,
    bell: Bi.BiBell,
};

const funCartoonIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Ri.RiDashboardLine,
    bookOpen: Ri.RiBookOpenLine,
    calendar: Ri.RiCalendarLine,
    dollarSign: Ri.RiMoneyDollarCircleLine,
    package: Ri.RiPackageLine,
    briefcase: Ri.RiBriefcaseLine,
    trendingUp: Ri.RiLineChartLine,
    messageSquare: Ri.RiChat4Line,
    settings: Ri.RiSettings3Line,
    bell: Ri.RiNotificationLine,
};

const funEmojiIcons: Record<IconKey, IconComponent> = {
    ...lucideIcons,
    dashboard: Fa.FaSmile,
    bookOpen: Fa.FaBook,
    calendar: Fa.FaCalendarAlt,
    dollarSign: Fa.FaDollarSign,
    package: Fa.FaBoxOpen || Fa.FaBox,
    briefcase: Fa.FaSuitcase || Fa.FaBriefcase,
    trendingUp: Fa.FaChartLine,
    messageSquare: Fa.FaCommentDots || Fa.FaComments,
    settings: Fa.FaCog,
    bell: Fa.FaBell,
};

// All icon sets mapping
const iconSets: Record<IconSetType, Record<IconKey, IconComponent>> = {
    lucide: lucideIcons,
    heroicons_outline: heroiconsOutlineIcons,
    heroicons_solid: heroiconsSolidIcons,
    phosphor_regular: phosphorIcons,
    phosphor_bold: phosphorIcons, // Will apply bold weight via props
    phosphor_fill: phosphorIcons, // Will apply fill via props
    tabler: tablerIcons,
    material_outlined: materialIcons,
    // Registered new icon libraries (react-icons mappings)
    ant_design: {
        ...lucideIcons,
        dashboard: Ai.AiOutlineDashboard,
        users: Ai.AiOutlineTeam,
        graduationCap: Ai.AiOutlineBook,
        bookOpen: Ai.AiOutlineBook,
        calendar: Ai.AiOutlineCalendar,
        dollarSign: Ai.AiOutlineDollarCircle,
        package: Ai.AiOutlineAppstore,
        briefcase: Ai.AiOutlineTool,
        settings: Ai.AiOutlineSetting,
        bell: Ai.AiOutlineBell,
    },
    feather: {
        ...lucideIcons,
        dashboard: Feather.Grid,
        users: Feather.Users,
        graduationCap: Feather.BookOpen,
        bookOpen: Feather.Book,
        calendar: Feather.Calendar,
        dollarSign: Feather.DollarSign,
        package: Feather.Package,
        briefcase: Feather.Briefcase,
        settings: Feather.Settings,
        bell: Feather.Bell,
    },
    fontawesome_solid: fontawesomeReactIcons,
    fontawesome_regular: fontawesomeReactIcons,
    boxicons: boxiconsReactIcons,
    simple_icons: simpleIconsReactIcons,
    ionicons: ioniconsReactIcons,
    eva_icons: {
        ...lucideIcons,
        // Eva Icons via Ci as a stable substitute for preview purposes
        dashboard: Ci.CiGrid41,
        users: Ci.CiUser,
        bookOpen: Ci.CiBook,
        calendar: Ci.CiCalendarDate,
        bell: Ci.CiBellOn,
    },
    // New react-icons backed sets (provide real mappings for common keys)
    bootstrap: bootstrapIcons,
    remix: remixIcons,
    boxicons_react: boxiconsReactIcons,
    fontawesome_react: fontawesomeReactIcons,
    game_icons: gameIcons,
    ionicons_react: ioniconsReactIcons,
    simple_icons_react: simpleIconsReactIcons,
    // Fun colorful sets
    fun_neon: funNeonIcons,
    fun_pastel: funPastelIcons,
    fun_cartoon: funCartoonIcons,
    fun_emoji: funEmojiIcons,
};

/**
 * Get an icon component for a given key and icon set
 */
export const getIcon = (key: IconKey, iconSet: IconSetType | string = 'lucide'): IconComponent => {
    const set = (iconSets as Record<string, Record<IconKey, IconComponent>>)[iconSet] || iconSets.lucide;
    return set[key] || lucideIcons[key];
};

/**
 * Get all available icon sets info
 */
export const getAvailableIconSets = (): IconSetInfo[] => {
    return Object.values(iconSetInfo);
};

/**
 * Get the current icon set from localStorage or default
 */
export const getCurrentIconSet = (): IconSetType => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('iconSet');
        if (stored && stored in iconSets) {
            return stored as IconSetType;
        }
    }
    return 'lucide';
};

/**
 * Set the current icon set and trigger a re-render
 */
export const setCurrentIconSet = (iconSet: IconSetType): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('iconSet', iconSet);
        // Dispatch a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('iconSetChanged', { detail: { iconSet } }));
    }
};

export default iconSets;
