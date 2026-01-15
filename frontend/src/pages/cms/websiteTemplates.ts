/**
 * Pre-built Website Templates for School Websites
 * Each template includes full page structures with sections ready for deployment
 */

export interface TemplateSection {
    id: string;
    component_type: string;
    title: string;
    content: Record<string, any>;
    order: number;
    is_visible: boolean;
    background_color?: string;
    text_color?: string;
    background_image?: string;
    padding?: string;
    style?: Record<string, any>;
}

export interface TemplatePage {
    title: string;
    slug: string;
    page_type: 'HOME' | 'ABOUT' | 'ACADEMICS' | 'ADMISSIONS' | 'CONTACT' | 'GALLERY' | 'EVENTS' | 'CUSTOM';
    sections: TemplateSection[];
}

export interface WebsiteTemplate {
    id: string;
    name: string;
    description: string;
    category: 'modern' | 'classic' | 'minimal' | 'vibrant' | 'professional';
    thumbnail: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    pages: TemplatePage[];
}

// Helper function to generate unique IDs
const uid = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
    // ==========================================
    // 1. MODERN BLUE ACADEMY (Full Multi-Page)
    // ==========================================
    {
        id: 'modern-blue-academy',
        name: 'Modern Blue Academy',
        description: 'Clean, professional design with blue accents. Perfect for progressive schools.',
        category: 'modern',
        thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        accentColor: '#60a5fa',
        fontFamily: 'Inter, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    {
                        id: uid(),
                        component_type: 'HERO',
                        title: 'Welcome Hero',
                        content: {
                            heading: "Shaping Tomorrow's Leaders Today",
                            subheading: 'A premier institution dedicated to academic excellence and holistic development with a world-class campus.',
                            buttonText: 'Apply Now',
                            buttonLink: '/admissions',
                            secondaryButtonText: 'Virtual Tour',
                            secondaryButtonLink: '/tour',
                            backgroundImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920'
                        },
                        order: 0,
                        is_visible: true,
                        background_color: '#1e40af',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'STATS',
                        title: 'Key Statistics',
                        content: {
                            stats: [
                                { value: '2500+', label: 'Students Enrolled' },
                                { value: '150+', label: 'Expert Faculty' },
                                { value: '25+', label: 'Years of Excellence' },
                                { value: '98%', label: 'Success Rate' }
                            ]
                        },
                        order: 1,
                        is_visible: true,
                        background_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'FEATURES',
                        title: 'Why Choose Us',
                        content: {
                            heading: 'Why Choose Our School',
                            features: [
                                { icon: '🎓', title: 'Academic Excellence', description: 'Rigorous curriculum with personalized attention and a focus on critical thinking.' },
                                { icon: '🔬', title: 'Modern Labs', description: 'State-of-the-art science, robotics and computer laboratories for hands-on learning.' },
                                { icon: '⚽', title: 'Sports Facilities', description: 'Olympic-standard sports infrastructure including indoor and outdoor courts.' },
                                { icon: '🎨', title: 'Arts & Culture', description: 'Comprehensive arts, music, and theater programs to nurture creative talent.' }
                            ]
                        },
                        order: 2,
                        is_visible: true,
                        background_color: '#f8fafc'
                    },
                    {
                        id: uid(),
                        component_type: 'PRINCIPAL_MESSAGE',
                        title: "Principal's Message",
                        content: {
                            name: 'Dr. Sarah Johnson',
                            designation: 'Principal & Director',
                            message: 'Education is not just about academics; it\'s about nurturing well-rounded individuals who can contribute positively to society. At our school, we believe in fostering creativity, critical thinking, and compassion. We invite you to join our community of learners.',
                            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800'
                        },
                        order: 3,
                        is_visible: true,
                        background_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'TESTIMONIALS',
                        title: 'Parent Feedback',
                        content: {
                            heading: 'What Parents Say',
                            testimonials: [
                                { name: 'Michael Smith', quote: "The best school in the region! My daughter's confidence has grown tremendously.", role: 'Parent of Grade 5 Student' },
                                { name: 'Elena Rodriguez', quote: "Professional teachers and amazing facilities. Highly recommended for holistic development.", role: 'Parent of Grade 9 Student' }
                            ]
                        },
                        order: 4,
                        is_visible: true,
                        background_color: '#f1f5f9'
                    },
                    {
                        id: uid(),
                        component_type: 'CTA',
                        title: 'Call to Action',
                        content: {
                            heading: 'Begin Your Child\'s Journey Today',
                            subheading: 'Admissions open for the 2024-25 academic year. Seats are limited!',
                            buttonText: 'Start Application',
                            buttonLink: '/admissions'
                        },
                        order: 5,
                        is_visible: true,
                        background_color: '#2563eb',
                        text_color: '#ffffff'
                    }
                ]
            },
            {
                title: 'About Us',
                slug: 'about',
                page_type: 'ABOUT',
                sections: [
                    {
                        id: uid(),
                        component_type: 'PAGE_HEADER',
                        title: 'About Header',
                        content: { heading: 'About Our Institution', breadcrumb: 'Home > About Us' },
                        order: 0,
                        is_visible: true,
                        background_color: '#1e40af',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'TEXT_WITH_IMAGE',
                        title: 'Our Story',
                        content: {
                            heading: 'Our Excellence Story',
                            text: 'Founded in 1998, our school has grown from a small institution to one of the region\'s most respected educational establishments. Our journey has been marked by continuous innovation and an unwavering commitment to student success. We believe in providing a nurturing environment where every child can flourish.',
                            image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1000'
                        },
                        order: 1,
                        is_visible: true
                    },
                    {
                        id: uid(),
                        component_type: 'MISSION_VISION',
                        title: 'Mission & Vision',
                        content: {
                            mission: 'To provide world-class education that empowers students to become responsible global citizens and lifelong learners.',
                            vision: 'To be the leading educational institution known for academic excellence, innovative pedagogy, and character development.',
                            values: ['Integrity', 'Excellence', 'Innovation', 'Compassion', 'Respect', 'Collaboration']
                        },
                        order: 2,
                        is_visible: true,
                        background_color: '#f8fafc'
                    },
                    {
                        id: uid(),
                        component_type: 'TIMELINE',
                        title: 'History Timeline',
                        content: {
                            heading: 'Our Milestone Journey',
                            events: [
                                { year: '1998', title: 'Foundation', description: 'The school was founded with 50 students.' },
                                { year: '2005', title: 'New Campus', description: 'Moved to our current 20-acre state-of-the-art campus.' },
                                { year: '2015', title: 'IB Accreditation', description: 'Received official accreditation for IB diploma program.' },
                                { year: '2023', title: 'Silver Jubilee', description: 'Celebrating 25 years of educational excellence.' }
                            ]
                        },
                        order: 3,
                        is_visible: true
                    }
                ]
            },
            {
                title: 'Academics',
                slug: 'academics',
                page_type: 'ACADEMICS',
                sections: [
                    {
                        id: uid(),
                        component_type: 'PAGE_HEADER',
                        title: 'Academics Header',
                        content: { heading: 'Academic Programs', breadcrumb: 'Home > Academics' },
                        order: 0,
                        is_visible: true,
                        background_color: '#1e40af',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'PROGRAMS',
                        title: 'Our Programs',
                        content: {
                            heading: 'Curriculum & Levels',
                            programs: [
                                { name: 'Early Years', description: 'Play-based learning for our youngest students.', ages: '3-5 Years' },
                                { name: 'Primary School', description: 'Strong foundation in core subjects with creative arts.', ages: '6-11 Years' },
                                { name: 'Middle School', description: 'Exploring interests and developing independent study skills.', ages: '12-14 Years' },
                                { name: 'High School', description: 'Preparing for university with rigorous academic pathways.', ages: '15-18 Years' }
                            ]
                        },
                        order: 1,
                        is_visible: true
                    }
                ]
            },
            {
                title: 'Admissions',
                slug: 'admissions',
                page_type: 'ADMISSIONS',
                sections: [
                    {
                        id: uid(),
                        component_type: 'PAGE_HEADER',
                        title: 'Admissions Header',
                        content: { heading: 'Join Our Community', breadcrumb: 'Home > Admissions' },
                        order: 0,
                        is_visible: true,
                        background_color: '#1e40af',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'FAQ',
                        title: 'Popular Questions',
                        content: {
                            heading: 'Admissions FAQ',
                            items: [
                                { question: 'When do admissions typically open?', answer: 'Admissions for the next academic year usually open in October.' },
                                { question: 'Is there an entrance exam?', answer: 'Yes, we conduct age-appropriate assessments for most grade levels.' },
                                { question: 'What documents are required?', answer: 'Previous school reports, birth certificate, and parent IDs are mandatory.' }
                            ]
                        },
                        order: 1,
                        is_visible: true
                    }
                ]
            },
            {
                title: 'Gallery',
                slug: 'gallery',
                page_type: 'GALLERY',
                sections: [
                    {
                        id: uid(),
                        component_type: 'PAGE_HEADER',
                        title: 'Gallery Header',
                        content: { heading: 'Life at Academy', breadcrumb: 'Home > Gallery' },
                        order: 0,
                        is_visible: true,
                        background_color: '#1e40af',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'IMAGE_GRID',
                        title: 'Campus Photos',
                        content: { columns: 3 },
                        order: 1,
                        is_visible: true
                    }
                ]
            },
            {
                title: 'Contact',
                slug: 'contact',
                page_type: 'CONTACT',
                sections: [
                    {
                        id: uid(),
                        component_type: 'PAGE_HEADER',
                        title: 'Contact Header',
                        content: { heading: 'Get In Touch', breadcrumb: 'Home > Contact' },
                        order: 0,
                        is_visible: true,
                        background_color: '#1e40af',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'CONTACT',
                        title: 'Contact Form',
                        content: {
                            address: '123 Education Excellence Way, Knowledge City',
                            phone: '+1 (555) 123-4567',
                            email: 'admissions@modernacademy.edu'
                        },
                        order: 1,
                        is_visible: true
                    }
                ]
            },
            {
                title: 'Events',
                slug: 'events',
                page_type: 'EVENTS',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Events Header', content: { heading: 'School Events', breadcrumb: 'Home > Events' }, order: 0, is_visible: true, background_color: '#1e40af', text_color: '#ffffff' },
                    { id: uid(), component_type: 'TIMELINE', title: 'Upcoming', content: { heading: 'Upcoming Highlights', events: [{ year: 'Feb 15', title: 'Sports Day', description: 'Annual athletic event.' }] }, order: 1, is_visible: true }
                ]
            },
            {
                title: 'Faculty',
                slug: 'faculty',
                page_type: 'CUSTOM',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Faculty Header', content: { heading: 'Our Educators', breadcrumb: 'Home > Faculty' }, order: 0, is_visible: true, background_color: '#1e40af', text_color: '#ffffff' }
                ]
            },
            {
                title: 'Campus Life',
                slug: 'campus-life',
                page_type: 'CUSTOM',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Campus Header', content: { heading: 'Student Life', breadcrumb: 'Home > Campus Life' }, order: 0, is_visible: true }
                ]
            },
            {
                title: 'Facilities',
                slug: 'facilities',
                page_type: 'CUSTOM',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Facilities Header', content: { heading: 'Infrastructure', breadcrumb: 'Home > Facilities' }, order: 0, is_visible: true }
                ]
            }
        ]
    },

    // ==========================================
    // 2. GREEN VALLEY SCHOOL
    // ==========================================
    {
        id: 'green-valley-school',
        name: 'Green Valley School',
        description: 'Nature-inspired design with eco-friendly vibes. Great for schools focusing on sustainability.',
        category: 'modern',
        thumbnail: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        primaryColor: '#059669',
        secondaryColor: '#047857',
        accentColor: '#34d399',
        fontFamily: 'Poppins, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    {
                        id: uid(),
                        component_type: 'HERO',
                        title: 'Welcome Hero',
                        content: {
                            heading: 'Where Nature Meets Knowledge',
                            subheading: 'An eco-conscious school nurturing future environmental leaders',
                            buttonText: 'Explore Campus',
                            buttonLink: '/about',
                            backgroundImage: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=1920'
                        },
                        order: 0,
                        is_visible: true,
                        background_color: '#059669',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'FEATURES',
                        title: 'Eco Programs',
                        content: {
                            heading: 'Our Green Initiatives',
                            features: [
                                { icon: '🌱', title: 'Organic Garden', description: 'Students learn agriculture and sustainability' },
                                { icon: '☀️', title: 'Solar Powered', description: '100% renewable energy campus' },
                                { icon: '♻️', title: 'Zero Waste', description: 'Comprehensive recycling programs' },
                                { icon: '🌳', title: 'Forest School', description: 'Outdoor learning experiences' }
                            ]
                        },
                        order: 1,
                        is_visible: true,
                        background_color: '#ecfdf5'
                    },
                    {
                        id: uid(),
                        component_type: 'TESTIMONIALS',
                        title: 'Parent Testimonials',
                        content: {
                            heading: 'What Parents Say',
                            testimonials: [
                                { name: 'Emma Wilson', role: 'Parent', quote: 'The emphasis on environmental education sets this school apart.' },
                                { name: 'Michael Chen', role: 'Parent', quote: 'My children have developed a deep appreciation for nature.' }
                            ]
                        },
                        order: 2,
                        is_visible: true,
                        background_color: '#f0fdf4'
                    }
                ]
            },
            {
                title: 'About Us',
                slug: 'about',
                page_type: 'ABOUT',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'About Header', content: { heading: 'Eco Stewardship', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#059669', text_color: '#ffffff' },
                    { id: uid(), component_type: 'MISSION_VISION', title: 'Eco Mission', content: { mission: 'To lead the way in sustainable education.', vision: 'A world where nature and education are perfectly aligned.', values: ['Nature', 'Balance', 'Growth'] }, order: 1, is_visible: true }
                ]
            },
            {
                title: 'Sustainability',
                slug: 'sustainability',
                page_type: 'CUSTOM',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Eco Header', content: { heading: 'Our Planet First', breadcrumb: 'Home > Sustainability' }, order: 0, is_visible: true, background_color: '#059669', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'Green Metrics', content: { heading: 'Eco Impact', features: [{ icon: '🔋', title: 'Renewable', description: '75% Energy from Solar' }, { icon: '💧', title: 'Water', description: 'Rainwater harvesting in use' }] }, order: 1, is_visible: true }
                ]
            },
            {
                title: 'Academics',
                slug: 'academics',
                page_type: 'ACADEMICS',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Academic Header', content: { heading: 'Outdoor Learning', breadcrumb: 'Home > Academics' }, order: 0, is_visible: true, background_color: '#059669', text_color: '#ffffff' }
                ]
            },
            {
                title: 'Admissions',
                slug: 'admissions',
                page_type: 'ADMISSIONS',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Admissions Header', content: { heading: 'Join the Green Tribe', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true, background_color: '#059669', text_color: '#ffffff' }
                ]
            },
            {
                title: 'Gallery',
                slug: 'gallery',
                page_type: 'GALLERY',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Gallery Header', content: { heading: 'Nature Shots', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true, background_color: '#059669', text_color: '#ffffff' },
                    { id: uid(), component_type: 'IMAGE_GRID', title: 'Campus Photos', content: { columns: 3 }, order: 1, is_visible: true }
                ]
            },
            {
                title: 'Our Staff',
                slug: 'staff',
                page_type: 'CUSTOM',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Staff Header', content: { heading: 'Eco Educators', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }
                ]
            },
            {
                title: 'News',
                slug: 'news',
                page_type: 'CUSTOM',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'News Header', content: { heading: 'School Updates', breadcrumb: 'Home > News' }, order: 0, is_visible: true }
                ]
            },
            {
                title: 'Events',
                slug: 'events',
                page_type: 'EVENTS',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Events Header', content: { heading: 'Eco Events', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }
                ]
            },
            {
                title: 'Contact',
                slug: 'contact',
                page_type: 'CONTACT',
                sections: [
                    { id: uid(), component_type: 'PAGE_HEADER', title: 'Contact Header', content: { heading: 'Message Us', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true },
                    { id: uid(), component_type: 'CONTACT', title: 'Contact Form', content: { address: 'Forest Way, Green Valley', phone: '+123 999 000', email: 'hello@greenvalley.edu' }, order: 1, is_visible: true }
                ]
            }
        ]
    },

    // ==========================================
    // 3. CLASSIC HERITAGE ACADEMY (Full Multi-Page)
    // ==========================================
    {
        id: 'classic-heritage-academy',
        name: 'Classic Heritage Academy',
        description: 'Traditional, prestigious design with gold accents. Ideal for established institutions.',
        category: 'classic',
        thumbnail: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        primaryColor: '#1a1a2e',
        secondaryColor: '#16213e',
        accentColor: '#d4af37',
        fontFamily: 'Playfair Display, serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    {
                        id: uid(),
                        component_type: 'HERO',
                        title: 'Welcome Hero',
                        content: {
                            heading: 'A Legacy of Excellence Since 1925',
                            subheading: 'Nurturing Scholars and Leaders through Tradition, Integrity, and Academic Rigor.',
                            buttonText: 'Request Prospectus',
                            buttonLink: '/admissions',
                            secondaryButtonText: 'Our History',
                            secondaryButtonLink: '/about',
                            backgroundImage: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=1920'
                        },
                        order: 0,
                        is_visible: true,
                        background_color: '#1a1a2e',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'STATS',
                        title: 'Heritage Stats',
                        content: {
                            stats: [
                                { value: '100+', label: 'Years of History' },
                                { value: '50,000+', label: 'Alumni Worldwide' },
                                { value: 'Ivy League', label: 'Placement Record' },
                                { value: '15:1', label: 'Faculty Ratio' }
                            ]
                        },
                        order: 1,
                        is_visible: true,
                        background_color: '#f8f5f0'
                    },
                    {
                        id: uid(),
                        component_type: 'PRINCIPAL_MESSAGE',
                        title: "Headmaster's Message",
                        content: {
                            name: 'Prof. Richard Worthington III',
                            designation: 'Headmaster',
                            message: 'For generations, Heritage Academy has stood as a beacon of traditional values and academic rigor. We continue to uphold the standards that have made us a distinguished institution, preparing students for the challenges of a global society.',
                            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800'
                        },
                        order: 2,
                        is_visible: true,
                        background_color: '#1a1a2e',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'TIMELINE',
                        title: 'Our History',
                        content: {
                            heading: 'A Century of Educational Excellence',
                            events: [
                                { year: '1925', title: 'Foundation', description: 'Established by Lord Heritage with an vision for classical education.' },
                                { year: '1960', title: 'Academic Expansion', description: 'Opening of the Great Hall and Library wing.' },
                                { year: '1995', title: 'Digital Era', description: 'Integrating modern technology with traditional pedagogy.' },
                                { year: '2025', title: 'Centennial', description: 'Celebrating 100 years of shaping young minds.' }
                            ]
                        },
                        order: 3,
                        is_visible: true,
                        background_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'CTA',
                        title: 'Join Us',
                        content: {
                            heading: 'Forge Your Future Here',
                            subheading: 'Admissions are highly selective for the upcoming centennial year.',
                            buttonText: 'Inquire Now',
                            buttonLink: '/contact'
                        },
                        order: 4,
                        is_visible: true,
                        background_color: '#d4af37',
                        text_color: '#ffffff'
                    }
                ]
            },
            {
                title: 'About Us',
                slug: 'about',
                page_type: 'ABOUT',
                sections: [
                    {
                        id: uid(),
                        component_type: 'PAGE_HEADER',
                        title: 'Heritage Header',
                        content: { heading: 'The Heritage Story', breadcrumb: 'Home > Our Heritage' },
                        order: 0,
                        is_visible: true,
                        background_color: '#1a1a2e',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'MISSION_VISION',
                        title: 'Tradition & Vision',
                        content: {
                            mission: 'To preserve the pursuit of wisdom through a rigorous classical education.',
                            vision: 'To remain the hallmark of traditional academic excellence for the next century.',
                            values: ['Honor', 'Tradition', 'Scholarship', 'Service']
                        },
                        order: 1,
                        is_visible: true,
                        background_color: '#f8f5f0'
                    }
                ]
            },
            {
                title: 'Contact',
                slug: 'contact',
                page_type: 'CONTACT',
                sections: [
                    {
                        id: uid(),
                        component_type: 'PAGE_HEADER',
                        title: 'Contact Header',
                        content: { heading: 'Visit Our Campus', breadcrumb: 'Home > Contact' },
                        order: 0,
                        is_visible: true,
                        background_color: '#1a1a2e',
                        text_color: '#ffffff'
                    },
                    {
                        id: uid(),
                        component_type: 'CONTACT',
                        title: 'Office Info',
                        content: {
                            address: '1 Heritage Park East, St. Davids Square',
                            phone: '+44 20 7123 4567',
                            email: 'registrar@heritageacademy.edu'
                        },
                        order: 1,
                        is_visible: true
                    }
                ]
            },
            {
                title: 'Admissions',
                slug: 'admissions',
                page_type: 'ADMISSIONS',
                sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Enrolment', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }]
            },
            {
                title: 'Academics',
                slug: 'academics',
                page_type: 'ACADEMICS',
                sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Pedagogy', breadcrumb: 'Home > Academics' }, order: 0, is_visible: true }]
            },
            {
                title: 'Faculty',
                slug: 'faculty',
                page_type: 'CUSTOM',
                sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Mentors', breadcrumb: 'Home > Faculty' }, order: 0, is_visible: true }]
            },
            {
                title: 'Events',
                slug: 'events',
                page_type: 'EVENTS',
                sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Traditions', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }]
            },
            {
                title: 'Gallery',
                slug: 'gallery',
                page_type: 'GALLERY',
                sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Visuals', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }]
            },
            {
                title: 'Alumni',
                slug: 'alumni',
                page_type: 'CUSTOM',
                sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Legacy', breadcrumb: 'Home > Alumni' }, order: 0, is_visible: true }]
            }
        ]
    },

    // ==========================================
    // 4. MINIMAL WHITE SCHOOL
    // ==========================================
    {
        id: 'minimal-white-school',
        name: 'Minimal White School',
        description: 'Clean, minimalist design with lots of white space. Modern and sophisticated.',
        category: 'minimal',
        thumbnail: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
        primaryColor: '#111827',
        secondaryColor: '#374151',
        accentColor: '#6366f1',
        fontFamily: 'DM Sans, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Minimal Hero', content: { heading: 'Education. Simplified.', subheading: 'Focus on what truly matters in learning', buttonText: 'Learn More', buttonLink: '/about' }, order: 0, is_visible: true, background_color: '#ffffff', text_color: '#111827' },
                    { id: uid(), component_type: 'TEXT_BLOCK', title: 'Philosophy', content: { text: 'We believe in the power of simplicity. Our approach strips away the unnecessary to focus on deep, meaningful learning experiences.' }, order: 1, is_visible: true, background_color: '#ffffff' }
                ]
            },
            { title: 'About', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Pure Vision', breadcrumb: 'Home > About' }, order: 0, is_visible: true }] },
            { title: 'Academics', slug: 'academics', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Core Study', breadcrumb: 'Home > Academics' }, order: 0, is_visible: true }] },
            { title: 'Admissions', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Join Simply', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Get in Touch', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Gallery', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Minimalist Views', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Events', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Upcoming', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'Curriculum', slug: 'curriculum', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Method', breadcrumb: 'Home > Curriculum' }, order: 0, is_visible: true }] },
            { title: 'Staff', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Minimal Mentors', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] },
            { title: 'Philosophy', slug: 'philosophy', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Core Ideas', breadcrumb: 'Home > Philosophy' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 5. VIBRANT KIDS SCHOOL
    // ==========================================
    {
        id: 'vibrant-kids-school',
        name: 'Vibrant Kids School',
        description: 'Colorful, playful design perfect for kindergartens and primary schools.',
        category: 'vibrant',
        thumbnail: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4',
        accentColor: '#FFE66D',
        fontFamily: 'Nunito, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Kids Hero', content: { heading: 'Where Learning is Fun! 🎨', subheading: 'Nurturing young minds through play and creativity', buttonText: 'Join Us!', buttonLink: '/admissions' }, order: 0, is_visible: true, background_color: '#FFE66D', text_color: '#333333' },
                    { id: uid(), component_type: 'FEATURES', title: 'Fun Activities', content: { heading: 'What We Offer', features: [{ icon: '🎪', title: 'Play-Based Learning', description: 'Learning through creative play' }, { icon: '🎵', title: 'Music & Dance', description: 'Express through rhythm' }] }, order: 1, is_visible: true, background_color: '#ffffff' }
                ]
            },
            { title: 'About', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Playful Journey', breadcrumb: 'Home > About' }, order: 0, is_visible: true }] },
            { title: 'Nursery', slug: 'nursery', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Happy Hearts', breadcrumb: 'Home > Nursery' }, order: 0, is_visible: true }] },
            { title: 'Join Us', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Start the Fun', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Say Hello', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Gallery', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Kiddo Moments', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Parties', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Fun Times', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'Kid Clubs', slug: 'clubs', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Little Explorers', breadcrumb: 'Home > Clubs' }, order: 0, is_visible: true }] },
            { title: 'Teachers', slug: 'teachers', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Fun Team', breadcrumb: 'Home > Teachers' }, order: 0, is_visible: true }] },
            { title: 'Parent Info', slug: 'parents', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Keeping in Touch', breadcrumb: 'Home > Parents' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 6. TECH SCHOOL PRO
    // ==========================================
    {
        id: 'tech-school-pro',
        name: 'Tech School Pro',
        description: 'Futuristic design for technology-focused schools and STEM programs.',
        category: 'modern',
        thumbnail: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        accentColor: '#22d3ee',
        fontFamily: 'Space Grotesk, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Tech Hero', content: { heading: 'Building the Digital Future', subheading: 'Where coding meets creativity and innovation thrives', buttonText: 'Explore Programs', buttonLink: '/academics' }, order: 0, is_visible: true, background_color: '#0f0c29', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'STEM Programs', content: { heading: 'Our STEM Excellence', features: [{ icon: '💻', title: 'Coding Academy', description: 'Python, JS, C++' }, { icon: '🤖', title: 'Robotics Lab', description: 'Arduino & LEGO Robotics' }] }, order: 1, is_visible: true, background_color: '#1a1a2e' }
                ]
            },
            { title: 'About Tech', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Digital First', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#0f0c29', text_color: '#ffffff' }] },
            { title: 'Innovation', slug: 'innovation', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Lab', breadcrumb: 'Home > Innovation' }, order: 0, is_visible: true }] },
            { title: 'Admissions', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Join the Future', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Terminal Sync', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Projects', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Build Log', breadcrumb: 'Home > Projects' }, order: 0, is_visible: true }] },
            { title: 'Hackathons', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Sync Events', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'Bootcamps', slug: 'bootcamps', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Intensive Training', breadcrumb: 'Home > Bootcamps' }, order: 0, is_visible: true }] },
            { title: 'Instructors', slug: 'faculty', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Core Developers', breadcrumb: 'Home > Faculty' }, order: 0, is_visible: true }] },
            { title: 'Roadmaps', slug: 'roadmaps', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Learning Paths', breadcrumb: 'Home > Roadmaps' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 7. INTERNATIONAL SCHOOL
    // ==========================================
    {
        id: 'international-school',
        name: 'International School',
        description: 'Global, diverse design for international and IB schools.',
        category: 'professional',
        thumbnail: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        primaryColor: '#1e3a8a',
        secondaryColor: '#2563eb',
        accentColor: '#f59e0b',
        fontFamily: 'Roboto, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Global Hero', content: { heading: 'Global Citizens. Local Hearts.', subheading: 'IB World School preparing students for an interconnected world', buttonText: 'Apply Now', buttonLink: '/admissions' }, order: 0, is_visible: true, background_color: '#1e3a8a', text_color: '#ffffff' },
                    { id: uid(), component_type: 'PROGRAMS', title: 'IB Programs', content: { heading: 'Our Programs', programs: [{ name: 'PYP', description: 'Primary Years Programme', ages: '3-11' }, { name: 'MYP', description: 'Middle Years Programme', ages: '11-16' }, { name: 'DP', description: 'Diploma Programme', ages: '16-18' }] }, order: 1, is_visible: true, background_color: '#f8fafc' }
                ]
            },
            { title: 'Global About', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The IB Mission', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#1e3a8a', text_color: '#ffffff' }] },
            { title: 'Primary (PYP)', slug: 'pyp', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Early Excellence', breadcrumb: 'Home > PYP' }, order: 0, is_visible: true }] },
            { title: 'Middle (MYP)', slug: 'myp', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Logical Inquiry', breadcrumb: 'Home > MYP' }, order: 0, is_visible: true }] },
            { title: 'Diploma (DP)', slug: 'dp', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Lead the Way', breadcrumb: 'Home > DP' }, order: 0, is_visible: true }] },
            { title: 'Apply Now', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Global Enrolment', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Global Sync', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Campus Photo', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Campus', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'UN Day', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Global Events', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'Global Staff', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'World Educators', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 8. ISLAMIC SCHOOL
    // ==========================================
    {
        id: 'islamic-school',
        name: 'Islamic School',
        description: 'Elegant design with Islamic patterns for faith-based schools.',
        category: 'classic',
        thumbnail: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        primaryColor: '#065f46',
        secondaryColor: '#047857',
        accentColor: '#d4af37',
        fontFamily: 'Amiri, serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Welcome Hero', content: { heading: 'Excellence in Faith and Knowledge', subheading: 'Nurturing minds with Islamic values and academic excellence', buttonText: 'Learn More', buttonLink: '/about' }, order: 0, is_visible: true, background_color: '#065f46', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'Our Pillars', content: { heading: 'Pillars of Education', features: [{ icon: '📖', title: 'Quran Studies', description: 'Tajweed and memorization' }, { icon: '📚', title: 'Academic Excellence', description: 'World-class curriculum' }] }, order: 1, is_visible: true, background_color: '#f0fdf4' }
                ]
            },
            { title: 'About Us', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Faith First', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#065f46', text_color: '#ffffff' }] },
            { title: 'Quran Lab', slug: 'quran', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Holy Text', breadcrumb: 'Home > Quran' }, order: 0, is_visible: true }] },
            { title: 'Arabic Pro', slug: 'arabic', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Language', breadcrumb: 'Home > Arabic' }, order: 0, is_visible: true }] },
            { title: 'Admissions', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Join the Ummah', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Get in Touch', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Visuals', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Campus Photos', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Eid Gala', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Upcoming Celebrations', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'The Masjid', slug: 'masjid', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Spiritual Center', breadcrumb: 'Home > Masjid' }, order: 0, is_visible: true }] },
            { title: 'Staff', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Educators', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 9. SPORTS ACADEMY
    // ==========================================
    {
        id: 'sports-academy',
        name: 'Sports Academy',
        description: 'Dynamic, energetic design for sports-focused schools.',
        category: 'vibrant',
        thumbnail: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
        primaryColor: '#dc2626',
        secondaryColor: '#ea580c',
        accentColor: '#fbbf24',
        fontFamily: 'Oswald, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Sports Hero', content: { heading: 'TRAIN. COMPETE. EXCEL.', subheading: 'Where champions are made and dreams take flight', buttonText: 'Join Our Team', buttonLink: '/admissions' }, order: 0, is_visible: true, background_color: '#dc2626', text_color: '#ffffff' },
                    { id: uid(), component_type: 'STATS', title: 'Achievements', content: { stats: [{ value: '100+', label: 'Champs' }, { value: '50+', label: 'National' }] }, order: 1, is_visible: true, background_color: '#1f2937', text_color: '#ffffff' }
                ]
            },
            { title: 'The Method', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Philosophy', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#dc2626', text_color: '#ffffff' }] },
            { title: 'Football', slug: 'football', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Pitch', breadcrumb: 'Home > Football' }, order: 0, is_visible: true }] },
            { title: 'Basketball', slug: 'basketball', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Court', breadcrumb: 'Home > Basketball' }, order: 0, is_visible: true }] },
            { title: 'Swimming', slug: 'swimming', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Pool', breadcrumb: 'Home > Swimming' }, order: 0, is_visible: true }] },
            { title: 'Join Now', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Draft Day', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Team Sync', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Action Gallery', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Game Day', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Game Schedule', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Fixtures', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'The Coaches', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Managers', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 10. ARTS CONSERVATORY
    // ==========================================
    {
        id: 'arts-conservatory',
        name: 'Arts Conservatory',
        description: 'Creative, artistic design for performing arts schools.',
        category: 'vibrant',
        thumbnail: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
        primaryColor: '#9333ea',
        secondaryColor: '#ec4899',
        accentColor: '#f472b6',
        fontFamily: 'Dancing Script, cursive',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Arts Hero', content: { heading: 'Where Art Comes Alive', subheading: 'Nurturing the next generation of artists and performers', buttonText: 'Audition Now', buttonLink: '/admissions' }, order: 0, is_visible: true, background_color: '#9333ea', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'Departments', content: { heading: 'Our Departments', features: [{ icon: '🎭', title: 'Drama', description: 'Theatre' }, { icon: '💃', title: 'Dance', description: 'Ballet & More' }] }, order: 1, is_visible: true, background_color: '#fdf4ff' }
                ]
            },
            { title: 'The Muse', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Creative Vision', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#9333ea', text_color: '#ffffff' }] },
            { title: 'Drama Deep', slug: 'drama', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Stage', breadcrumb: 'Home > Drama' }, order: 0, is_visible: true }] },
            { title: 'Dance Flow', slug: 'dance', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Studio', breadcrumb: 'Home > Dance' }, order: 0, is_visible: true }] },
            { title: 'Music Theory', slug: 'music', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'The Sound', breadcrumb: 'Home > Music' }, order: 0, is_visible: true }] },
            { title: 'Auditions', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Cast Call', breadcrumb: 'Home > Auditions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Art Sync', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Portfolio', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Exhibitions', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Live Shows', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Curtain Up', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'The Faculty', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Creative Minds', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 11. MONTESSORI SCHOOL
    // ==========================================
    {
        id: 'montessori-school',
        name: 'Montessori School',
        description: 'Warm, natural design for Montessori education approach.',
        category: 'minimal',
        thumbnail: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        primaryColor: '#d97706',
        secondaryColor: '#b45309',
        accentColor: '#fbbf24',
        fontFamily: 'Quicksand, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Montessori Hero', content: { heading: 'Follow the Child', subheading: 'Authentic Montessori education for curious young minds', buttonText: 'Discover More', buttonLink: '/about' }, order: 0, is_visible: true, background_color: '#fffbeb', text_color: '#78350f' },
                    { id: uid(), component_type: 'FEATURES', title: 'Montessori Way', content: { heading: 'The Montessori Way', features: [{ icon: '🧸', title: 'Prepared Environment', description: 'Spaces' }, { icon: '👶', title: 'Mixed Ages', description: 'Community' }] }, order: 1, is_visible: true }
                ]
            },
            { title: 'The Method', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Maria Montessori', breadcrumb: 'Home > About' }, order: 0, is_visible: true }] },
            { title: 'Practical Life', slug: 'practical', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Daily Independence', breadcrumb: 'Home > Practical' }, order: 0, is_visible: true }] },
            { title: 'Sensory', slug: 'sensory', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Exploring Senses', breadcrumb: 'Home > Sensory' }, order: 0, is_visible: true }] },
            { title: 'Inquire', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Join the Journey', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Connect', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Atmosphere', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Environment', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Workshop', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Parent Sessions', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'Outdoors', slug: 'outdoors', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Nature Study', breadcrumb: 'Home > Outdoors' }, order: 0, is_visible: true }] },
            { title: 'The Guides', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Facilitators', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 12. BOARDING SCHOOL
    // ==========================================
    {
        id: 'boarding-school',
        name: 'Boarding School',
        description: 'Prestigious design for residential schools.',
        category: 'classic',
        thumbnail: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        primaryColor: '#1e293b',
        secondaryColor: '#334155',
        accentColor: '#c2410c',
        fontFamily: 'Crimson Pro, serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Boarding Hero', content: { heading: 'A Home Away From Home', subheading: 'Premium residential education in a nurturing environment', buttonText: 'Virtual Tour', buttonLink: '/campus' }, order: 0, is_visible: true, background_color: '#1e293b', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'Campus Life', content: { heading: 'Campus Facilities', features: [{ icon: '🛏️', title: 'Dormitories', description: 'Safe living' }, { icon: '🍽️', title: 'Dining', description: 'Nutritious meals' }] }, order: 1, is_visible: true }
                ]
            },
            { title: 'Tradition', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our History', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#1e293b', text_color: '#ffffff' }] },
            { title: 'Residence', slug: 'residence', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Dorm Life', breadcrumb: 'Home > Residence' }, order: 0, is_visible: true }] },
            { title: 'Academics', slug: 'academics', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Rigorous Study', breadcrumb: 'Home > Academics' }, order: 0, is_visible: true }] },
            { title: 'Apply', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Join the Legacy', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Inquiries', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'The Campus', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Visual Legacy', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Founder Day', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Traditions', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'Welfare', slug: 'welfare', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Student Care', breadcrumb: 'Home > Welfare' }, order: 0, is_visible: true }] },
            { title: 'House Masters', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Mentors', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 13. SPECIAL NEEDS SCHOOL
    // ==========================================
    {
        id: 'special-needs-school',
        name: 'Inclusive Learning Center',
        description: 'Warm, accessible design for special education institutions.',
        category: 'minimal',
        thumbnail: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
        primaryColor: '#7c3aed',
        secondaryColor: '#6d28d9',
        accentColor: '#a78bfa',
        fontFamily: 'Open Sans, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Inclusive Hero', content: { heading: 'Every Child Can Shine', subheading: 'Personalized learning for every unique ability', buttonText: 'Learn About Us', buttonLink: '/about' }, order: 0, is_visible: true, background_color: '#7c3aed', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'Our Programs', content: { heading: 'Specialized Programs', features: [{ icon: '💜', title: 'Individual Plans', description: 'Tailored' }, { icon: '🎯', title: 'Therapy', description: 'Speech & OT' }] }, order: 1, is_visible: true, background_color: '#faf5ff' }
                ]
            },
            { title: 'Inclusion', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Heart', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#7c3aed', text_color: '#ffffff' }] },
            { title: 'Sensory Lab', slug: 'sensory', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Tactile Learning', breadcrumb: 'Home > Sensory' }, order: 0, is_visible: true }] },
            { title: 'Life Skills', slug: 'skills', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Independence', breadcrumb: 'Home > Skills' }, order: 0, is_visible: true }] },
            { title: 'Enrolment', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Join the Center', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Connect', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Smile Gallery', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Inclusive Joy', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Awareness Day', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Community Events', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'Resources', slug: 'resources', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Parent Tools', breadcrumb: 'Home > Resources' }, order: 0, is_visible: true }] },
            { title: 'Therapists', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Specialist Team', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 14. LANGUAGE SCHOOL
    // ==========================================
    {
        id: 'language-school',
        name: 'Language Academy',
        description: 'Multicultural design for language learning institutions.',
        category: 'modern',
        thumbnail: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
        primaryColor: '#0891b2',
        secondaryColor: '#0e7490',
        accentColor: '#22d3ee',
        fontFamily: 'Lato, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Language Hero', content: { heading: 'Speak the World', subheading: 'Master new languages and unlock global opportunities', buttonText: 'Start Learning', buttonLink: '/courses' }, order: 0, is_visible: true, background_color: '#0891b2', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'Languages', content: { heading: 'Languages', features: [{ icon: '🇬🇧', title: 'English', description: 'Business' }, { icon: '🇫🇷', title: 'French', description: 'DELF' }] }, order: 1, is_visible: true }
                ]
            },
            { title: 'The Polyglot', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Linguistics', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#0891b2', text_color: '#ffffff' }] },
            { title: 'English Hub', slug: 'english', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Anglosphere', breadcrumb: 'Home > English' }, order: 0, is_visible: true }] },
            { title: 'French Hub', slug: 'french', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Francophonie', breadcrumb: 'Home > French' }, order: 0, is_visible: true }] },
            { title: 'Japanese Lab', slug: 'japanese', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Nihongo', breadcrumb: 'Home > Japanese' }, order: 0, is_visible: true }] },
            { title: 'Enroll', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Begin Today', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Global Sync', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Cultural Day', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'World Gallery', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Language Cafe', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Immersive Meetups', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'The Tutors', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Native Speakers', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 15. GIRLS SCHOOL
    // ==========================================
    {
        id: 'girls-school',
        name: 'Girls Excellence Academy',
        description: 'Empowering design for all-girls educational institutions.',
        category: 'professional',
        thumbnail: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
        primaryColor: '#be185d',
        secondaryColor: '#9d174d',
        accentColor: '#f472b6',
        fontFamily: 'Libre Baskerville, serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Empowerment Hero', content: { heading: 'Empowering Future Leaders', subheading: 'Where young women discover their potential and purpose', buttonText: 'Join Us', buttonLink: '/admissions' }, order: 0, is_visible: true, background_color: '#be185d', text_color: '#ffffff' },
                    { id: uid(), component_type: 'STATS', title: 'Achievements', content: { stats: [{ value: '100%', label: 'Uni Placement' }, { value: '70+', label: 'STEM' }] }, order: 1, is_visible: true, background_color: '#fdf2f8' }
                ]
            },
            { title: 'The Vision', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Lead the Way', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#be185d', text_color: '#ffffff' }] },
            { title: 'STEM Girls', slug: 'stem', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Scientific Minds', breadcrumb: 'Home > STEM' }, order: 0, is_visible: true }] },
            { title: 'Liberal Arts', slug: 'arts', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Creative Depth', breadcrumb: 'Home > Arts' }, order: 0, is_visible: true }] },
            { title: 'Leadership', slug: 'leadership', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Future Leaders', breadcrumb: 'Home > Leadership' }, order: 0, is_visible: true }] },
            { title: 'Enrol', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Join the Sisterhood', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Sync with Us', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Campus Snap', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Visual Legacy', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Debate Finals', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Notable Events', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'Empowerment Team', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Our Mentors', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 16. MILITARY SCHOOL
    // ==========================================
    {
        id: 'military-school',
        name: 'Cadets Academy',
        description: 'Disciplined, structured design for military-style schools.',
        category: 'professional',
        thumbnail: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
        primaryColor: '#166534',
        secondaryColor: '#14532d',
        accentColor: '#d4af37',
        fontFamily: 'Russo One, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Military Hero', content: { heading: 'HONOR • DISCIPLINE • EXCELLENCE', subheading: 'Building character and leadership through structured education', buttonText: 'Enroll Now', buttonLink: '/admissions' }, order: 0, is_visible: true, background_color: '#166534', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'Core Values', content: { heading: 'Values', features: [{ icon: '🎖️', title: 'Honor', description: 'Integrity' }, { icon: '⚔️', title: 'Discipline', description: 'Focus' }] }, order: 1, is_visible: true }
                ]
            },
            { title: 'The Creed', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Legacy of Honor', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#166534', text_color: '#ffffff' }] },
            { title: 'Tactics Room', slug: 'tactics', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Strategic Study', breadcrumb: 'Home > Tactics' }, order: 0, is_visible: true }] },
            { title: 'Fitness Lab', slug: 'fitness', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Physical Excellence', breadcrumb: 'Home > Fitness' }, order: 0, is_visible: true }] },
            { title: 'Cadet Skills', slug: 'skills', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Field Proficiency', breadcrumb: 'Home > Skills' }, order: 0, is_visible: true }] },
            { title: 'Enlist', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Cadet Selection', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Chain of Command', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Drill Video', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Cadet Life', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Passing Out', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Ceremonials', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'The Officers', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Command Staff', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 17. MUSIC CONSERVATORY
    // ==========================================
    {
        id: 'music-conservatory',
        name: 'Harmony Music School',
        description: 'Elegant design for music schools and conservatories.',
        category: 'classic',
        thumbnail: 'linear-gradient(135deg, #3f3f46 0%, #52525b 100%)',
        primaryColor: '#3f3f46',
        secondaryColor: '#27272a',
        accentColor: '#c2410c',
        fontFamily: 'Cormorant Garamond, serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'Music Hero', content: { heading: 'Where Music Speaks', subheading: 'Classical training for the modern musician', buttonText: 'Schedule Audition', buttonLink: '/auditions' }, order: 0, is_visible: true, background_color: '#3f3f46', text_color: '#ffffff' },
                    { id: uid(), component_type: 'FEATURES', title: 'Departments', content: { heading: 'Study Areas', features: [{ icon: '🎹', title: 'Piano', description: 'Classic' }, { icon: '🎻', title: 'Strings', description: 'Orchestra' }] }, order: 1, is_visible: true }
                ]
            },
            { title: 'The Ethos', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Musical Heritage', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#3f3f46', text_color: '#ffffff' }] },
            { title: 'The Piano', slug: 'piano', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Mastering Ivory', breadcrumb: 'Home > Piano' }, order: 0, is_visible: true }] },
            { title: 'The Violin', slug: 'violin', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Mastering Bow', breadcrumb: 'Home > Violin' }, order: 0, is_visible: true }] },
            { title: 'The Theory', slug: 'theory', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Music Theory', breadcrumb: 'Home > Theory' }, order: 0, is_visible: true }] },
            { title: 'Auditions', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Show Your Talent', breadcrumb: 'Home > Auditions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Sync Notes', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'Recitals', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Visual Harmony', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'Concert Hall', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Live Recitals', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'The Maestros', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Lead Conductors', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },

    // ==========================================
    // 18. MEDICAL PREP SCHOOL
    // ==========================================
    {
        id: 'medical-prep-school',
        name: 'MedPrep Academy',
        description: 'Professional design for pre-medical and health science schools.',
        category: 'professional',
        thumbnail: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
        primaryColor: '#0284c7',
        secondaryColor: '#0369a1',
        accentColor: '#38bdf8',
        fontFamily: 'Source Sans Pro, sans-serif',
        pages: [
            {
                title: 'Home',
                slug: 'home',
                page_type: 'HOME',
                sections: [
                    { id: uid(), component_type: 'HERO', title: 'MedPrep Hero', content: { heading: 'Your Journey to Medicine Starts Here', subheading: 'Preparing future doctors with rigorous pre-medical education', buttonText: 'Apply Now', buttonLink: '/admissions' }, order: 0, is_visible: true, background_color: '#0284c7', text_color: '#ffffff' },
                    { id: uid(), component_type: 'STATS', title: 'Success Stats', content: { stats: [{ value: '95%', label: 'Med School' }, { value: '500+', label: 'Doctors' }] }, order: 1, is_visible: true, background_color: '#f0f9ff' }
                ]
            },
            { title: 'The Clinic', slug: 'about', page_type: 'ABOUT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Medical Excellence', breadcrumb: 'Home > About' }, order: 0, is_visible: true, background_color: '#0284c7', text_color: '#ffffff' }] },
            { title: 'Biology Lab', slug: 'biology', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Life Science', breadcrumb: 'Home > Biology' }, order: 0, is_visible: true }] },
            { title: 'Chemistry Lab', slug: 'chemistry', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Atomic Study', breadcrumb: 'Home > Chemistry' }, order: 0, is_visible: true }] },
            { title: 'MCAT Drill', slug: 'mcat', page_type: 'ACADEMICS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Prep Training', breadcrumb: 'Home > MCAT' }, order: 0, is_visible: true }] },
            { title: 'Apply Today', slug: 'admissions', page_type: 'ADMISSIONS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Join MedPrep', breadcrumb: 'Home > Admissions' }, order: 0, is_visible: true }] },
            { title: 'Contact', slug: 'contact', page_type: 'CONTACT', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Emergency Sync', breadcrumb: 'Home > Contact' }, order: 0, is_visible: true }] },
            { title: 'The Lab', slug: 'gallery', page_type: 'GALLERY', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Visual Science', breadcrumb: 'Home > Gallery' }, order: 0, is_visible: true }] },
            { title: 'White Coat', slug: 'events', page_type: 'EVENTS', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Academic Rituls', breadcrumb: 'Home > Events' }, order: 0, is_visible: true }] },
            { title: 'The Doctors', slug: 'staff', page_type: 'CUSTOM', sections: [{ id: uid(), component_type: 'PAGE_HEADER', title: 'Header', content: { heading: 'Lead Pathologists', breadcrumb: 'Home > Staff' }, order: 0, is_visible: true }] }
        ]
    },
];

// Template category labels
export const TEMPLATE_CATEGORIES = [
    { value: 'all', label: 'All Templates' },
    { value: 'modern', label: '🚀 Modern' },
    { value: 'classic', label: '🏛️ Classic' },
    { value: 'minimal', label: '✨ Minimal' },
    { value: 'vibrant', label: '🎨 Vibrant' },
    { value: 'professional', label: '💼 Professional' }
];
