import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { InfoButton } from './InfoButton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  Home,
  FileCheck2,
  ShieldAlert,
  Store,
  Receipt,
  HeartHandshake,
  PieChart as PieIcon,
  Filter,
  ArrowUpRight,
  Download,
  Calendar,
  Sparkles,
  Layers,
  Scale,
  Award,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
} from 'lucide-react';

const CHART_COLORS = {
  indigo: '#4f46e5',
  teal: '#0d9488',
  emerald: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  purple: '#9333ea',
  blue: '#2563eb',
  cyan: '#0891b2',
  slate: '#64748b',
};

const PIE_PALETTE = ['#4f46e5', '#0d9488', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#6366f1', '#f43f5e'];

export const DashboardAnalytics: React.FC = () => {
  const {
    settings,
    residents,
    households,
    certificates,
    blotters,
    complaints,
    businesses,
    transactions,
    appointments,
    setActiveModule,
    arePuroksMatching,
  } = useBarangay();

  const [selectedPurokFilter, setSelectedPurokFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'demographics' | 'financial' | 'peace_order' | 'housing'>('overview');

  // Filtered residents based on selected Purok
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchPurok = arePuroksMatching(r.purok, selectedPurokFilter);
      return r.residentStatus === 'Active' && matchPurok;
    });
  }, [residents, selectedPurokFilter, arePuroksMatching]);

  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      return arePuroksMatching(h.purok, selectedPurokFilter);
    });
  }, [households, selectedPurokFilter, arePuroksMatching]);

  const filteredBlotters = useMemo(() => {
    return blotters.filter((b) => {
      return arePuroksMatching(b.purok, selectedPurokFilter);
    });
  }, [blotters, selectedPurokFilter, arePuroksMatching]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      return arePuroksMatching(b.purok, selectedPurokFilter);
    });
  }, [businesses, selectedPurokFilter, arePuroksMatching]);

  // Demographic computations
  const totalPop = filteredResidents.length;
  const maleCount = filteredResidents.filter((r) => r.sex === 'Male').length;
  const femaleCount = filteredResidents.filter((r) => r.sex === 'Female').length;
  const malePct = totalPop > 0 ? Math.round((maleCount / totalPop) * 100) : 0;
  const femalePct = totalPop > 0 ? 100 - malePct : 0;

  const seniorCount = filteredResidents.filter((r) => r.isSeniorCitizen || r.age >= 60).length;
  const pwdCount = filteredResidents.filter((r) => r.isPWD).length;
  const fourPsCount = filteredResidents.filter((r) => r.is4PsBeneficiary).length;
  const soloParentCount = filteredResidents.filter((r) => r.isSoloParent).length;
  const indigentCount = filteredResidents.filter((r) => r.isIndigent).length;
  const youthCount = filteredResidents.filter((r) => r.isYouth || (r.age >= 15 && r.age <= 30)).length;
  const voterCount = filteredResidents.filter((r) => r.voterStatus === 'Registered').length;
  const outOfSchoolYouth = filteredResidents.filter((r) => r.isOutofSchoolYouth).length;

  // Age bracket breakdown
  const ageGroupsData = useMemo(() => {
    const brackets = [
      { name: 'Infants (0-4)', range: [0, 4], count: 0, male: 0, female: 0 },
      { name: 'Children (5-14)', range: [5, 14], count: 0, male: 0, female: 0 },
      { name: 'Youth (15-24)', range: [15, 24], count: 0, male: 0, female: 0 },
      { name: 'Young Adults (25-39)', range: [25, 39], count: 0, male: 0, female: 0 },
      { name: 'Middle Age (40-59)', range: [40, 59], count: 0, male: 0, female: 0 },
      { name: 'Seniors (60+)', range: [60, 150], count: 0, male: 0, female: 0 },
    ];

    filteredResidents.forEach((r) => {
      const match = brackets.find((b) => r.age >= b.range[0] && r.age <= b.range[1]);
      if (match) {
        match.count++;
        if (r.sex === 'Male') match.male++;
        else match.female++;
      }
    });

    return brackets;
  }, [filteredResidents]);

  // Purok distribution data
  const purokDistributionData = useMemo(() => {
    const list = settings?.puroks || [];
    return list.map((p) => {
      const pResidents = residents.filter((r) => r.residentStatus === 'Active' && arePuroksMatching(r.purok, p));
      const pHouseholds = households.filter((h) => arePuroksMatching(h.purok, p));
      const pBlotters = blotters.filter((b) => arePuroksMatching(b.purok, p));
      return {
        name: p.replace('Purok ', 'P-'),
        fullName: p,
        residents: pResidents.length,
        households: pHouseholds.length,
        blotters: pBlotters.length,
      };
    });
  }, [settings?.puroks, residents, households, blotters, arePuroksMatching]);

  // Sex distribution pie data
  const sexDistributionData = useMemo(() => {
    return [
      { name: 'Male', value: maleCount, color: '#4f46e5' },
      { name: 'Female', value: femaleCount, color: '#ec4899' },
    ];
  }, [maleCount, femaleCount]);

  // Certificate issuance by type
  const certificatesByTypeData = useMemo(() => {
    const typeMap: { [key: string]: number } = {};
    certificates.forEach((c) => {
      const type = c.type || 'Other';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    return Object.entries(typeMap)
      .map(([name, count]) => ({
        name: name.replace('Certificate of ', 'Cert. ').replace('Barangay ', 'Brgy. '),
        fullName: name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [certificates]);

  // Monthly Revenue Trend
  const revenueTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const map: { [month: string]: { revenue: number; certificates: number } } = {};

    months.forEach((m) => {
      map[m] = { revenue: 0, certificates: 0 };
    });

    // Populate from transactions
    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      if (!isNaN(date.getTime())) {
        const monthName = months[date.getMonth()];
        if (map[monthName]) {
          map[monthName].revenue += tx.amount || 0;
        }
      }
    });

    // Populate certificates count
    certificates.forEach((c) => {
      const date = new Date(c.dateIssued);
      if (!isNaN(date.getTime())) {
        const monthName = months[date.getMonth()];
        if (map[monthName]) {
          map[monthName].certificates += 1;
        }
      }
    });

    // Filter to months up to current or recent
    return months.slice(0, 9).map((m) => ({
      month: m,
      revenue: map[m].revenue || 0,
      certificates: map[m].certificates || 0,
    }));
  }, [transactions, certificates]);

  // Peace & Order resolution metrics
  const blotterStatusData = useMemo(() => {
    const statusCounts: { [key: string]: number } = {
      'Amicably Settled / Resolved': 0,
      'Active Investigation / Pending': 0,
      'Mediation / Lupon': 0,
      'Referred to PNP': 0,
      'Dismissed': 0,
    };

    filteredBlotters.forEach((b) => {
      const st = b.status;
      if (st === 'Settled' || st === 'Amicably Settled') {
        statusCounts['Amicably Settled / Resolved']++;
      } else if (st === 'Mediation' || st === 'Forwarded to Lupon') {
        statusCounts['Mediation / Lupon']++;
      } else if (st === 'Referred to PNP') {
        statusCounts['Referred to PNP']++;
      } else if (st === 'Dismissed') {
        statusCounts['Dismissed']++;
      } else {
        statusCounts['Active Investigation / Pending']++;
      }
    });

    return Object.entries(statusCounts)
      .map(([name, value], idx) => ({
        name,
        value,
        color: PIE_PALETTE[idx % PIE_PALETTE.length],
      }))
      .filter((d) => d.value > 0);
  }, [filteredBlotters]);

  // Incident Type distribution
  const incidentTypeData = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    filteredBlotters.forEach((b) => {
      const t = b.incidentType || 'Other';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([name, count]) => ({
        name: name.length > 20 ? `${name.substring(0, 18)}...` : name,
        fullName: name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredBlotters]);

  // Housing infrastructure data
  const housingTypeData = useMemo(() => {
    const typeMap: { [key: string]: number } = {};
    filteredHouseholds.forEach((h) => {
      const ht = h.housingType || 'Concrete';
      typeMap[ht] = (typeMap[ht] || 0) + 1;
    });

    return Object.entries(typeMap).map(([name, value], idx) => ({
      name,
      value,
      color: PIE_PALETTE[idx % PIE_PALETTE.length],
    }));
  }, [filteredHouseholds]);

  const waterSourceData = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredHouseholds.forEach((h) => {
      const ws = h.waterSource || 'Piped Water / Utility';
      map[ws] = (map[ws] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][idx % 5],
    }));
  }, [filteredHouseholds]);

  // Total collected revenue
  const totalRevenue = useMemo(() => {
    return transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transactions]);

  // Lupon Resolution Rate
  const totalBlottersCount = filteredBlotters.length;
  const settledBlottersCount = filteredBlotters.filter(
    (b) => b.status === 'Settled' || b.status === 'Amicably Settled'
  ).length;
  const resolutionRate = totalBlottersCount > 0 ? Math.round((settledBlottersCount / totalBlottersCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header with Title, Purok Selector, and Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Barangay Intelligence & Analytics Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Live Sync
                </span>
                <InfoButton
                  title="Intelligence & Analytics"
                  info={`Real-time demographics, civil registry trends, revenue streams, and peace & order indicators for ${settings.barangayName}.`}
                  variant="light"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Purok Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-normal">Purok:</span>
              <select
                aria-label="Filter analytics by Purok"
                value={selectedPurokFilter}
                onChange={(e) => setSelectedPurokFilter(e.target.value)}
                className="bg-transparent font-bold text-indigo-600 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Puroks (Consolidated)</option>
                {(settings.puroks || []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action to Reports */}
            <button
              onClick={() => setActiveModule('reports')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Full Reports & Print</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('demographics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'demographics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Demographics & Age Pyramid</span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'financial'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Revenue & Clearances</span>
          </button>

          <button
            onClick={() => setActiveTab('peace_order')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'peace_order'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Peace, Order & Lupon</span>
          </button>

          <button
            onClick={() => setActiveTab('housing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'housing'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Housing & Utilities</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Population</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalPop}</div>
          <p className="text-[10px] text-slate-500 mt-1">
            {maleCount} Male • {femaleCount} Female
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Voter Capacity</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{voterCount}</div>
          <p className="text-[10px] text-teal-700 font-semibold mt-1">
            {totalPop > 0 ? ((voterCount / totalPop) * 100).toFixed(1) : 0}% Registered
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Households</span>
            <Home className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{filteredHouseholds.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">
            Avg {(totalPop / (filteredHouseholds.length || 1)).toFixed(1)} pax / unit
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Revenue</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">₱{totalRevenue.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 mt-1">
            {certificates.length} clearances issued
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lupon Rate</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{resolutionRate}%</div>
          <p className="text-[10px] text-amber-700 font-medium mt-1">
            {settledBlottersCount} of {totalBlottersCount} cases settled
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Enterprises</span>
            <Store className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">{filteredBusinesses.length}</div>
          <p className="text-[10px] text-purple-700 font-medium mt-1">
            Commercial establishments
          </p>
        </div>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Top Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Purok Population & Household Bar Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Population & Household Density by Purok
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Barangay Census</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Comparative distribution of active residents and registered family household units
                </p>

                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={purokDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="residents" name="Residents" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="households" name="Households" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sex Ratio & Demographic Donut */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-rose-500" />
                    <h4 className="text-sm font-bold text-slate-900">Gender & Sex Distribution</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-2">Civil status ratio of active inhabitants</p>

                <div className="h-48 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sexDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sexDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                    <span className="text-lg font-black text-slate-900">{totalPop}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Male</span>
                    <p className="text-base font-black text-indigo-900">{maleCount}</p>
                    <span className="text-[10px] text-indigo-600 font-semibold">{malePct}%</span>
                  </div>
                  <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 text-center">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Female</span>
                    <p className="text-base font-black text-rose-900">{femaleCount}</p>
                    <span className="text-[10px] text-rose-600 font-semibold">{femalePct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vulnerability & Sectoral Breakdown Cards */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-indigo-400" />
                  <span>Socio-Economic & Special Sector Analytics</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target welfare beneficiaries, national programs (4Ps/DSWD), and priority assistance groups
                </p>
              </div>
              <span className="text-[10px] font-bold bg-slate-800 text-indigo-300 px-2.5 py-1 rounded-full border border-slate-700">
                Welfare Monitoring
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-300">Senior Citizens</span>
                <div className="text-xl font-black text-amber-400">{seniorCount}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${totalPop > 0 ? (seniorCount / totalPop) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">
                  {totalPop > 0 ? ((seniorCount / totalPop) * 100).toFixed(0) : 0}% of population
                </span>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-300">PWDs</span>
                <div className="text-xl font-black text-purple-400">{pwdCount}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-400 h-full rounded-full"
                    style={{ width: `${totalPop > 0 ? (pwdCount / totalPop) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">
                  {totalPop > 0 ? ((pwdCount / totalPop) * 100).toFixed(0) : 0}% of population
                </span>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-300">4Ps Beneficiaries</span>
                <div className="text-xl font-black text-emerald-400">{fourPsCount}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${totalPop > 0 ? (fourPsCount / totalPop) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">DSWD Pantawid</span>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-300">Solo Parents</span>
                <div className="text-xl font-black text-cyan-400">{soloParentCount}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full"
                    style={{ width: `${totalPop > 0 ? (soloParentCount / totalPop) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">RA 11861 Beneficiaries</span>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-300">Indigent Families</span>
                <div className="text-xl font-black text-rose-400">{indigentCount}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-400 h-full rounded-full"
                    style={{ width: `${totalPop > 0 ? (indigentCount / totalPop) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">Low-income bracket</span>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-300">Youth (SK / 15-30)</span>
                <div className="text-xl font-black text-indigo-400">{youthCount}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-400 h-full rounded-full"
                    style={{ width: `${totalPop > 0 ? (youthCount / totalPop) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">
                  {totalPop > 0 ? ((youthCount / totalPop) * 100).toFixed(0) : 0}% Katipunan
                </span>
              </div>
            </div>
          </div>

          {/* Revenue & Issuance Mini Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Trend Line */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Monthly Revenue & Fee Collections (₱)
                  </h4>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  Total: ₱{totalRevenue.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Official receipts issued across calendar months</p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: number | string | undefined) => [`₱${Number(val || 0).toLocaleString()}`, 'Revenue']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₱)"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Certificate Type Breakdown */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">Clearances by Type</h4>
                </div>
                <span className="text-xs font-bold text-indigo-700">{certificates.length} Total</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Volume of public documents and certifications issued</p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={certificatesByTypeData.slice(0, 5)}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" name="Certificates Issued" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Demographics & Age Pyramid */}
      {activeTab === 'demographics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Age Pyramid Bar Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Population Age & Sex Cohort Distribution</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Male vs Female representation across standard age groups in {selectedPurokFilter === 'all' ? 'the Barangay' : selectedPurokFilter}
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGroupsData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="male" name="Male Inhabitants" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="female" name="Female Inhabitants" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demographic Ratio & Statistics Summary */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Demographic Indices</h4>
                <p className="text-xs text-slate-500">Key census indicators & statistical proportions</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Youth Dependency Ratio</span>
                    <p className="text-[11px] text-slate-500">Ages 0-14 per 100 working age</p>
                  </div>
                  <span className="text-sm font-black text-indigo-700">
                    {filteredResidents.filter((r) => r.age >= 15 && r.age < 60).length > 0
                      ? Math.round(
                          (filteredResidents.filter((r) => r.age < 15).length /
                            filteredResidents.filter((r) => r.age >= 15 && r.age < 60).length) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Elderly Index</span>
                    <p className="text-[11px] text-slate-500">Seniors (60+) per 100 working age</p>
                  </div>
                  <span className="text-sm font-black text-amber-700">
                    {filteredResidents.filter((r) => r.age >= 15 && r.age < 60).length > 0
                      ? Math.round(
                          (filteredResidents.filter((r) => r.age >= 60).length /
                            filteredResidents.filter((r) => r.age >= 15 && r.age < 60).length) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Sex Ratio (M:F)</span>
                    <p className="text-[11px] text-slate-500">Males per 100 Females</p>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {femaleCount > 0 ? ((maleCount / femaleCount) * 100).toFixed(0) : 100}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">COMELEC Voter Density</span>
                    <p className="text-[11px] text-slate-500">Registered vs Total Population</p>
                  </div>
                  <span className="text-sm font-black text-teal-700">
                    {totalPop > 0 ? ((voterCount / totalPop) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Financial & Revenue */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Monthly Cash Collections & Clearance Volume</span>
                  </h4>
                  <p className="text-xs text-slate-500">Monthly breakdown of fee remittances and receipts</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium">Total Fees Remitted</span>
                  <p className="text-lg font-black text-emerald-700">₱{totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrendData} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: number | string | undefined, name: string | undefined) => [
                        name === 'Revenue (₱)' ? `₱${Number(val || 0).toLocaleString()}` : val,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="revenue" name="Revenue (₱)" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="certificates" name="Clearances Issued" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Standard Fee Schedule & Top Earners */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Standard Ordinance Rates</h4>
                <p className="text-xs text-slate-500">Active tariff schedule per Barangay Ordinance</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Barangay Clearance</span>
                  <span className="font-bold text-slate-900">₱{settings.clearanceFeeRegular}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Business Clearance</span>
                  <span className="font-bold text-slate-900">₱{settings.businessClearanceFee}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Certificate of Residency</span>
                  <span className="font-bold text-slate-900">₱{settings.residencyCertFee}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Certificate of Indigency</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {settings.indigencyCertFee === 0 ? 'FREE / ₱0' : `₱${settings.indigencyCertFee}`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Good Moral Character</span>
                  <span className="font-bold text-slate-900">₱{settings.goodMoralFee}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveModule('transactions')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>View All Official Receipts</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Peace & Order */}
      {activeTab === 'peace_order' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lupon Status Donut */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>Lupon Tagapamayapa Case Status</span>
                  </h4>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {filteredBlotters.length} Recorded
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Mediation, resolution, and settlement efficiency</p>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={blotterStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {blotterStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Incident Categories */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Incident Nature & Categories</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">KP Registry</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Top reported disputes, complaints, and ordinance violations</p>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={incidentTypeData}
                      margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" name="Reported Incidents" fill="#e11d48" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Housing & Utilities */}
      {activeTab === 'housing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Housing Structural Quality */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Home className="w-4 h-4 text-indigo-600" />
                  <span>Housing Structural Type</span>
                </h4>
                <span className="text-xs font-bold text-indigo-700">
                  {filteredHouseholds.length} Units Surveyed
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Construction materials and housing safety status</p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={housingTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {housingTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Water Access & Sanitation */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-600" />
                  <span>Water & Utility Access</span>
                </h4>
                <span className="text-xs font-bold text-cyan-700">Sanitation Audit</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Primary potable water sources across family units</p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterSourceData} margin={{ top: 10, right: 15, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" name="Households" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
