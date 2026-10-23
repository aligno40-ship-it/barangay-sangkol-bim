import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { RepublicSeal, BarangaySangkolSeal } from './OfficialSeals';
import { AnnouncementRecord, CommunityActivity } from '../types';
import { LegalPolicyTab } from './LegalPoliciesModal';
import {
  ShieldCheck,
  FileCheck2,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Calendar,
  Sparkles,
  Award,
  CheckCircle2,
  Check,
  Shield,
  HeartPulse,
  Scale,
  Trash2,
  HelpCircle,
  Menu,
  X,
  FileText,
  UserPlus,
  LogIn,
  QrCode,
  Lock,
  ArrowUpRight,
  Layers,
  Activity,
  Megaphone,
  Briefcase,
  Share2,
} from 'lucide-react';

export interface LandingPageProps {
  onGoToLogin: (mode?: 'resident' | 'official') => void;
  onOpenRegister: () => void;
  onOpenVerification: (controlNumber?: string) => void;
  onOpenLegalModal: (tab: LegalPolicyTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onOpenRegister,
  onOpenVerification,
  onOpenLegalModal,
}) => {
  const {
    settings,
    officials,
    announcements,
    activities,
  } = useBarangay();

  // Category filter for Frontline Public Services
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<
    'all' | 'civil' | 'social' | 'justice'
  >('all');

  // Announcement reader modal state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRecord | null>(null);

  // Active verified announcements (top 3 pinned or latest)
  const activeAnnouncements = useMemo(() => {
    return [...announcements]
      .filter((a) => a.status === 'Active')
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      })
      .slice(0, 3);
  }, [announcements]);

  // Upcoming community activities (top 3)
  const upcomingActivities = useMemo(() => {
    return [...activities]
      .filter((act) => act.status === 'Upcoming' || act.status === 'Ongoing')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [activities]);

  // Officials roster (sorted by order)
  const sortedOfficials = useMemo(() => {
    return [...officials].sort((a, b) => (a.order || 99) - (b.order || 99));
  }, [officials]);

  // 6 Primary Frontline Services
  const servicesData = [
    {
      id: 'clearance',
      title: 'Barangay Clearance',
      localTitle: 'Barangay Clearance para sa Trabaho at Pagkakakilanlan',
      category: 'civil',
      icon: FileCheck2,
      badge: 'Most Requested',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      fee: '₱50.00',
      feeNote: 'Official LGU Rate',
      turnaround: '15 - 30 Minutes',
      validity: '6 Months from issuance',
      description:
        'Official clearance certifying good moral character, no derogatory record in the barangay blotter, and active residency.',
      uses: ['Job Employment & Overseas Applications', 'Philippine Postal ID & Police Clearance', 'Bank Account Opening', 'Scholarships & Board Exams'],
      requirements: ['1 Valid Government-issued Photo ID', 'Community Tax Certificate (Cedula)', 'Proof of Residency (if newly moved)'],
    },
    {
      id: 'residency',
      title: 'Certificate of Residency',
      localTitle: 'Katibayan ng Paninirahan',
      category: 'civil',
      icon: MapPin,
      badge: 'Standard E-Service',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      fee: '₱50.00',
      feeNote: 'Official LGU Rate',
      turnaround: '15 Minutes',
      validity: '6 Months from issuance',
      description:
        'Certifies that the named citizen is a bona fide resident of Barangay Sangkol living within their declared Purok.',
      uses: ['DepEd & CHED School Enrollment', 'Utility Meter Application (Electricity/Water)', 'Bank & Loan Requirements', 'Voter Registration / Transfer'],
      requirements: ['Valid ID with current address', 'Purok Leader Verification / Endorsement', 'Recent Proof of Billing'],
    },
    {
      id: 'indigency',
      title: 'Certificate of Indigency',
      localTitle: 'Katibayan ng Kawalan ng Sapat na Kita',
      category: 'social',
      icon: HeartPulse,
      badge: 'FREE of Charge',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      fee: '₱0.00 (FREE)',
      feeNote: 'Social Protection Law',
      turnaround: 'Immediate / Same Day',
      validity: '3 Months (Medical/Financial)',
      description:
        'Issued to low-income residents and families needing government social assistance, medical subsidies, or educational grants.',
      uses: ['DSWD AICS Medical & Financial Subsidy', 'Government Hospital Billing Reductions', 'Public Attorney’s Office (PAO) Legal Aid', 'LGU Educational Financial Assistance'],
      requirements: ['Valid Government ID / PhilSys', 'Purok Indigency Endorsement', 'Case Summary or Hospital Bill (if medical)'],
    },
    {
      id: 'business',
      title: 'Barangay Business Clearance',
      localTitle: 'Pahintulot sa Negosyo at Kalakalan',
      category: 'justice',
      icon: Building2,
      badge: 'Commercial',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      fee: '₱150.00',
      feeNote: 'Annual Barangay Ordinance',
      turnaround: '24 Hours',
      validity: '1 Calendar Year (Jan 1 - Dec 31)',
      description:
        'Official prerequisite clearance required prior to Mayor’s Business Permit issuance or renewal in the City of Dipolog.',
      uses: ['New Business Permit Application', 'Annual Mayor’s Permit Renewal', 'DTI / SEC Business Registration Compliance', 'Commercial Bank Accounts'],
      requirements: ['DTI / SEC Certificate of Registration', 'Lease Contract or Land Title', 'Barangay Sanitary / Safety Inspection Clearance'],
    },
    {
      id: 'lupon',
      title: 'Katarungang Pambarangay',
      localTitle: 'Lupon Tagapamayapa Mediation & Conciliation',
      category: 'justice',
      icon: Scale,
      badge: 'Community Justice',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      fee: '₱0.00 (FREE)',
      feeNote: 'Sovereign Conciliation',
      turnaround: '3-Day Summons Period',
      validity: 'Binding Amicable Settlement',
      description:
        'Neighborhood dispute resolution and mediation under RA 7160. Amicable settlement of civil and light criminal disputes before court filing.',
      uses: ['Neighborhood boundary and noise disputes', 'Unpaid personal debts and financial claims', 'Light physical injuries & slander conciliation', 'Issuance of Certificate to File Action (CFA)'],
      requirements: ['Filing of formal incident complaint narrative', 'Personal appearance of complainant and respondent', 'Purok settlement attempt record'],
    },
    {
      id: 'health',
      title: 'Sangkol Health & Nutrition Center',
      localTitle: 'Pangkalusugan at Bakuna sa Barangay',
      category: 'social',
      icon: Activity,
      badge: 'Frontline Healthcare',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      fee: '₱0.00 (FREE)',
      feeNote: 'Universal Health Care',
      turnaround: 'Walk-in / Mon - Fri',
      validity: 'Continuous Clinical Care',
      description:
        'Primary healthcare facility providing free infant immunizations, maternal prenatal checks, vital signs monitoring, and maintenance medicines.',
      uses: ['Infant & Child Expanded Immunization (EPI)', 'Maternal Prenatal & Postpartum Checkups', 'Hypertension & Diabetes maintenance medicines', 'First-aid, wound dressing, and referral to Dipolog City Health'],
      requirements: ['Barangay Sangkol Resident Health Card (Yellow Card)', 'Valid ID or PhilHealth Number', 'Immunization Baby Book'],
    },
  ];

  const filteredServices = servicesData.filter((s) => {
    if (selectedServiceCategory === 'all') return true;
    return s.category === selectedServiceCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-700 selection:text-white antialiased">
      {/* 1. TOP SOVEREIGN REPUBLIC BANNER */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">Republika ng Pilipinas</span>
            <span className="text-slate-500">•</span>
            <span>Lungsod ng Dipolog, Zamboanga del Norte</span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-emerald-400 font-medium">
              Barangay Sangkol Digital E-Services Portal
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mon - Fri: 8:00 AM - 5:00 PM (No Noon Break)</span>
            </div>
            <span className="hidden lg:inline text-slate-600">|</span>
            <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Desk: {settings.contactNumber || '(065) 212-3456'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY MAIN NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Seals and Barangay Sangkol Identity */}
            <div className="flex items-center gap-3.5">
              <div className="flex items-center -space-x-2 shrink-0">
                <RepublicSeal size={46} className="relative z-10 drop-shadow-xs" />
                <BarangaySangkolSeal size={48} className="relative z-20 drop-shadow-xs" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Official Portal
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                    Dipolog City
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                  Barangay Sangkol
                </h1>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Information & Citizen E-Services System (BIMS)
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onGoToLogin('official')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
                title="Barangay Kagawad, Secretary, & Staff Login"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Staff Login</span>
              </button>

              <button
                type="button"
                onClick={() => onGoToLogin('resident')}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Resident Portal</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <section id="overview" className="relative overflow-hidden bg-slate-900 text-white py-16 lg:py-24">
        {/* Subtle Sovereign Watermark Background */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 lg:right-16 opacity-[0.04] pointer-events-none select-none hidden md:block">
          <RepublicSeal size={480} />
        </div>
        <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none select-none hidden lg:block">
          <BarangaySangkolSeal size={380} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Lungsod ng Dipolog • Official Digital Governance Portal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Serbisyong Tapat, Mabilis, at Digital Para sa Mamamayan ng{' '}
                <span className="text-emerald-400 underline decoration-emerald-600/60 decoration-wavy">
                  Sangkol
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                Ang opisyal na 24/7 digital gateway ng Barangay Sangkol, Dipolog City. Mag-request ng barangay
                clearance, alamin ang mga public health services, at mag-ulat ng hinaing sa inyong pamahalaang
                lokal anumang oras.
              </p>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onGoToLogin('resident')}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  <span>Enter Resident Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Register as Resident</span>
                </button>

                <button
                  type="button"
                  onClick={() => onGoToLogin('official')}
                  className="px-4 py-3.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Barangay Staff Access</span>
                </button>
              </div>

              {/* Citizen Trust Badges */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>RA 11032 Anti-Red Tape Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>Data Privacy Act of 2012 (RA 10173)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Automated SMS Status Dispatch</span>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* 4. FRONTLINE PUBLIC SERVICES DIRECTORY */}
      <section id="services" className="py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Citizen Frontline Catalog
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Mga Serbisyong Publiko at Sertipikasyon
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Clearances, permits, social assistance, and community services. Apply through the Resident
            Portal or visit the frontline desks at the Barangay Sangkol Hall.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => setSelectedServiceCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedServiceCategory === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Services ({servicesData.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedServiceCategory('civil')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedServiceCategory === 'civil'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Civil Clearances & Residency
            </button>
            <button
              type="button"
              onClick={() => setSelectedServiceCategory('social')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedServiceCategory === 'social'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Social Aid & Health
            </button>
            <button
              type="button"
              onClick={() => setSelectedServiceCategory('justice')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedServiceCategory === 'justice'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Business & Conciliation
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv) => {
            const IconComponent = srv.icon;
            return (
              <div
                key={srv.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${srv.badgeColor}`}
                    >
                      {srv.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {srv.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-2">{srv.localTitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{srv.description}</p>

                  {/* Pricing and Turnaround metrics */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        Official Fee
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">{srv.fee}</span>
                      <span className="text-[10px] text-slate-500 block">{srv.feeNote}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        Processing Time
                      </span>
                      <span className="font-bold text-slate-800">{srv.turnaround}</span>
                      <span className="text-[10px] text-slate-500 block">{srv.validity}</span>
                    </div>
                  </div>

                  {/* Requirements List */}
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wide">
                      Standard Requirements:
                    </span>
                    <ul className="space-y-1">
                      {srv.requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-600 flex items-start gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onGoToLogin('resident')}
                    className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Apply via Resident Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. ANTI-TAMPER SECURITY & QR VERIFICATION SPOTLIGHT */}
      <section id="verification" className="bg-slate-900 text-white py-16 lg:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/30">
                Security & Anti-Counterfeiting
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Cryptographic Document Integrity & QR Seal
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Upang maprotektahan ang ating mga mamamayan laban sa pamemeke ng mga dokumento, bawat
                clearance at sertipiko na inilalabas ng Barangay Sangkol ay mayroong naka-embed na
                anti-tamper QR Code at SHA-256 digital control fingerprint.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-white">Instant Cross-Verification</h3>
                    <p className="text-xs text-slate-400">
                      Mabilisang ma-scan ng kahit anong smartphone camera, employer, embahada, o bangko
                      para kumpirmahin ang opisyal na rekord.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-white">Cryptographic Hash Security</h3>
                    <p className="text-xs text-slate-400">
                      Hindi maaaring baguhin ang pangalan, petsa, o detalye nang hindi nagdudulot ng invalid
                      checksum alert sa verification portal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-white">Official Receipt (OR#) Traceability</h3>
                    <p className="text-xs text-slate-400">
                      Naka-ugnay sa opisyal na resibo ng treasury upang masiguro ang 100% financial
                      transparency sa pondong pambarangay.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onOpenVerification()}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Launch Official Verification Scanner</span>
                </button>
              </div>
            </div>

            {/* Visual Interactive Certificate Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl text-slate-800 border-4 border-emerald-600/30">
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <BarangaySangkolSeal size={40} />
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">
                        Republic of the Philippines
                      </div>
                      <div className="text-xs font-black text-slate-900">Barangay Sangkol, Dipolog City</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Security QR</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">PROTECTED SEAL</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-center">
                  <h4 className="text-sm font-black text-slate-900 tracking-wider uppercase">
                    BARANGAY CLEARANCE SPECIMEN
                  </h4>
                  <p className="text-[11px] text-slate-500 italic">
                    Certified official document template secured by LGU-Dipolog digital signature and tamper-resistant QR hash.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Document Security:</span>
                    <span className="font-bold text-slate-800">Tamper-Proof Digital Seal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jurisdiction:</span>
                    <span className="font-semibold text-slate-800">Barangay Sangkol, Dipolog City</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data Privacy:</span>
                    <span className="font-mono text-[11px] text-slate-600">RA 10173 Compliant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verification:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      QR DEPLOYED & AUTHENTIC
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2.5 text-left">
                    <QrCode className="w-8 h-8 text-emerald-800 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                        Anti-Tamper QR Verification
                      </span>
                      <span className="text-[10px] text-emerald-700">Verify via camera or online portal</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                    Official Specimen
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LATEST ANNOUNCEMENTS & OFFICIAL BULLETINS */}
      <section id="announcements" className="py-16 lg:py-20 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                Public Advisories & Notices
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                Mga Opisyal na Patalastas at Anunsyo
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Pinakahuling balita at mga alituntunin mula sa Sangguniang Barangay ng Sangkol.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onGoToLogin('resident')}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer self-start sm:self-auto"
            >
              <span>View all in Resident Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {ann.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{ann.publishDate}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {ann.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                    By: {ann.author}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(ann)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer hover:underline"
                  >
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. COMMUNITY CALENDAR & UPCOMING CIVIC ACTIVITIES */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Community Calendar
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Paparating na mga Aktibidad at Programa
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Samahan ang ating mga clean-up drives, health missions, at mga pangkalahatang asembleya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingActivities.map((act) => (
              <div
                key={act.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {act.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {act.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">{act.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">{act.description}</p>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-white p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold">{act.date}</span>
                      <span className="text-slate-400">•</span>
                      <span>{act.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate">{act.venue}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onGoToLogin('resident')}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Join via Resident Portal
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. BARANGAY LEADERSHIP & SANGGUNIAN COUNCIL */}
      <section id="officials" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
              Sangguniang Barangay
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Mga Pinuno ng Barangay Sangkol
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Namumuno nang may pananagutan, katapatan, at integridad para sa kapakanan ng bawat mamamayan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedOfficials.slice(0, 8).map((off) => (
              <div
                key={off.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 text-center flex flex-col items-center hover:border-emerald-300 transition-colors shadow-xs"
              >
                {/* Official Avatar / Seal */}
                <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-emerald-600/30 flex items-center justify-center text-emerald-800 font-bold mb-3 shadow-inner overflow-hidden">
                  {off.photoUrl ? (
                    <img
                      src={off.photoUrl}
                      alt={off.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BarangaySangkolSeal size={64} />
                  )}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
                  {off.position}
                </span>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{off.name}</h3>

                <p className="text-xs text-slate-500 font-medium mt-0.5 mb-2">
                  {off.committee || 'Sanggunian Member'}
                </p>

                <div className="mt-auto pt-2 text-[11px] text-slate-400 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{off.contactNumber || '(065) 212-3456'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CITIZEN'S CHARTER & FRONTLINE COMMITMENT (RA 11032) */}
      <section id="charter" className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              RA 11032 Compliance
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Citizen's Charter & Frontline Pledges
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Ease of Doing Business & Efficient Government Service Delivery Act of 2018.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Hakbang 1: Pag-file o Pag-request</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Magsumite ng kahilingan gamit ang Resident Portal online o magtungo sa Frontline Public
                Assistance Desk sa Barangay Hall kalakip ang inyong valid ID.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Hakbang 2: Pagsusuri at SMS Alert</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Awtomatikong sinusuri ng Barangay Secretary ang inyong rekord sa civil registry. Makakatanggap
                kayo ng instant SMS text alert sa inyong mobile number kapag handa na ang inyong dokumento.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Hakbang 3: Pag-claim at QR Seal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                I-claim ang orihinal na dokumentong may dry seal at anti-counterfeit QR code kasama ang opisyal na
                resibo (Official Receipt). Zero hidden charges guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. HALL DIRECTORY & 24/7 EMERGENCY HOTLINES */}
      <section id="contact" className="py-16 lg:py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Hall Information */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/30">
                Frontline Directory
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Barangay Hall ng Sangkol
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Bukas ang tanggapan mula Lunes hanggang Biyernes upang maglingkod sa inyo. Walang noon break
                alinsunod sa batas ng serbisyo publiko.
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Tirahan at Lokasyon:</span>
                    <span className="text-slate-300">
                      {settings.hallAddress || 'Purok 3 (Sentro), Barangay Sangkol, Dipolog City, 7100 Zamboanga del Norte'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Oras ng Serbisyo:</span>
                    <span className="text-slate-300">Lunes - Biyernes: 8:00 AM - 5:00 PM (Continuous Service)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Opisyal na Email:</span>
                    <span className="text-slate-300">
                      {settings.email || 'barangay.sangkol@dipologcity.gov.ph'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Emergency 24/7 Hotlines */}
            <div className="lg:col-span-6">
              <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700">
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>24/7 Emergency Dispatch Hotlines</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Mga Numero Kung May Sakuna o Emergency
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80">
                    <div>
                      <span className="text-xs font-bold text-white block">Barangay Tanod (BPAT Peace & Order)</span>
                      <span className="text-[11px] text-slate-400">Sangkol Incident Command Post</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      0917-123-4567
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80">
                    <div>
                      <span className="text-xs font-bold text-white block">Sangkol Health Center & First Aid</span>
                      <span className="text-[11px] text-slate-400">Maternity & Ambulance Dispatch</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      0928-765-4321
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80">
                    <div>
                      <span className="text-xs font-bold text-white block">Dipolog City Police Station (PNP)</span>
                      <span className="text-[11px] text-slate-400">National Police Hotline</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-blue-400">
                      (065) 212-2525 / 166
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80">
                    <div>
                      <span className="text-xs font-bold text-white block">Bureau of Fire Protection (BFP)</span>
                      <span className="text-[11px] text-slate-400">Dipolog Central Fire Station</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      (065) 212-3111 / 911
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. SOVEREIGN FOOTER & LEGAL COMPLIANCE */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1: Brand & Sovereignty */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <RepublicSeal size={40} />
                <BarangaySangkolSeal size={42} />
                <div>
                  <div className="text-sm font-bold text-white">Barangay Sangkol, Dipolog City</div>
                  <div className="text-[11px] text-slate-500">
                    Information Management System • Bagong Pilipinas
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Opisyal na sistemang digital na itinatag upang magbigay ng tapat, mabilis, at de-kalidad na
                serbisyo publiko sa lahat ng mamamayan ng Barangay Sangkol, Lungsod ng Dipolog.
              </p>
            </div>

            {/* Col 2: Quick E-Services */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Mga E-Serbisyo
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onGoToLogin('resident')}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Barangay Clearance
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onGoToLogin('resident')}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Certificate of Residency
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onGoToLogin('resident')}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Certificate of Indigency
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenVerification()}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Document Authenticity Checker
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Portal Access & Compliance */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Portal & Pagsunod
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onGoToLogin('resident')}
                    className="text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    Resident Portal Sign In
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onGoToLogin('official')}
                    className="hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Staff & Admin Access
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Register as Resident
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal('privacy')}
                    className="hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Data Privacy Act (RA 10173)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 Local Government Unit of Barangay Sangkol, City of Dipolog. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onOpenLegalModal('privacy')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Privacy Notice
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegalModal('terms')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Terms of Use
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegalModal('cookies')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Cookie Policy
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ANNOUNCEMENT DETAIL READER MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                {selectedAnnouncement.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedAnnouncement.publishDate}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-4 leading-tight">
              {selectedAnnouncement.title}
            </h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-6 text-sm text-slate-700 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-line">
              {selectedAnnouncement.content}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-4">
              <span>Author: <strong className="text-slate-800">{selectedAnnouncement.author}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setSelectedAnnouncement(null);
                  onGoToLogin('resident');
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
              >
                View in Resident Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
