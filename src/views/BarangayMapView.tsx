import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { InfoButton } from '../components/InfoButton';
import {
  MapPin,
  Users,
  Home,
  Award,
  Megaphone,
  CalendarDays,
  ShieldAlert,
  Store,
  PhoneCall,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  HeartPulse,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Printer,
  ExternalLink,
  Shield,
  Eye,
  Filter,
  Globe2,
  Compass,
  Navigation,
  Crosshair,
  Satellite,
  Maximize2,
  Minimize2,
  Search,
  Waves,
  Mountain,
  Trees,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';

// Real geographic coordinates of Barangay Sangkol, Dipolog City, Zamboanga del Norte
const SANGKOL_CENTER: [number, number] = [8.4803, 123.3490]; // 8°28'49" N, 123°20'56" E
const SANGKOL_ELEVATION = '55m - 60m ASL';
const SANGKOL_REGION = 'Region IX (Zamboanga Peninsula)';
const SANGKOL_CITY = 'Dipolog City, Zamboanga del Norte';

interface LandmarkData {
  id: string;
  name: string;
  purok: string;
  type: 'hall' | 'health' | 'school' | 'court' | 'tanod' | 'chapel' | 'evacuation' | 'river' | 'agri';
  coords: [number, number]; // [lat, lng]
  svgCoords: { x: number; y: number };
  description: string;
  contact?: string;
  head?: string;
}

interface PurokMeta {
  id: string;
  name: string;
  code: string;
  color: string;
  fillColor: string;
  strokeColor: string;
  darkColor: string;
  textColor: string;
  bgLight: string;
  tagline: string;
  landArea: string;
  elevation: string;
  boundaryNotes: string;
  purokLeader: string;
  purokLeaderContact: string;
  tanodLead: string;
  tanodContact: string;
  healthWorker: string;
  healthWorkerContact: string;
  description: string;
  centerCoords: [number, number]; // [lat, lng]
  centerSvg: { x: number; y: number };
  geoPolygon: [number, number][]; // Real Leaflet LatLng coordinates
  svgPath: string;
  hazardRisk: 'Low' | 'Moderate (River Stream)' | 'Moderate (Upland Slope)';
}

const PUROK_DEFINITIONS: PurokMeta[] = [
  {
    id: 'Purok Pinya',
    name: 'Purok Pinya',
    code: 'PINYA-01',
    color: '#EAB308',
    fillColor: 'rgba(234, 179, 8, 0.25)',
    strokeColor: '#CA8A04',
    darkColor: '#854D0E',
    textColor: 'text-amber-900',
    bgLight: 'bg-amber-50 border-amber-200',
    tagline: 'Northern Agro-Residential & Green Plain Zone',
    landArea: '14.2 Hectares',
    elevation: '52 meters ASL',
    boundaryNotes: 'Bounded north by Brgy. San Jose and west by orchard access trails',
    purokLeader: 'Kgd. Pedro L. Cruz / Mr. Danilo D. Pinya',
    purokLeaderContact: '0920-888-5678',
    tanodLead: 'Tanod Rogelio M. Santos',
    tanodContact: '0920-111-4433',
    healthWorker: 'BHW Elena Dela Cruz',
    healthWorkerContact: '0920-333-8899',
    description:
      'Purok Pinya comprises the northwestern green plains of Barangay Sangkol, known for fertile fruit orchards, peaceful residential communities, and farm cooperatives along the San Jose access road.',
    centerCoords: [8.4855, 123.3450],
    centerSvg: { x: 230, y: 150 },
    geoPolygon: [
      [8.4895, 123.3420],
      [8.4890, 123.3480],
      [8.4825, 123.3465],
      [8.4820, 123.3405],
    ],
    svgPath: 'M 70 80 L 310 60 L 340 190 L 220 250 L 80 230 Z',
    hazardRisk: 'Low',
  },
  {
    id: 'Purok Lumboy',
    name: 'Purok Lumboy',
    code: 'LUMBOY-02',
    color: '#8B5CF6',
    fillColor: 'rgba(139, 92, 246, 0.25)',
    strokeColor: '#7C3AED',
    darkColor: '#5B21B6',
    textColor: 'text-purple-900',
    bgLight: 'bg-purple-50 border-purple-200',
    tagline: 'Northeastern Commercial & Polanco Connector Corridor',
    landArea: '12.8 Hectares',
    elevation: '54 meters ASL',
    boundaryNotes: 'Bordered east by Municipality of Polanco (Barangays Obay & Silawe)',
    purokLeader: 'Kgd. Teresa G. Mendoza / Mrs. Lolita Ramos',
    purokLeaderContact: '0918-222-1111',
    tanodLead: 'Tanod Victor A. Lumboy',
    tanodContact: '0918-999-5544',
    healthWorker: 'BHW Marites Valenzuela',
    healthWorkerContact: '0918-444-7711',
    description:
      'Purok Lumboy hosts high-density residential subdivisions, local cooperatives, commercial stores, and connects directly with the Dipolog-Polanco provincial transport artery.',
    centerCoords: [8.4860, 123.3535],
    centerSvg: { x: 480, y: 140 },
    geoPolygon: [
      [8.4890, 123.3480],
      [8.4885, 123.3580],
      [8.4830, 123.3575],
      [8.4835, 123.3515],
    ],
    svgPath: 'M 310 60 L 590 70 L 620 220 L 460 250 L 340 190 Z',
    hazardRisk: 'Low',
  },
  {
    id: 'Purok Mangga',
    name: 'Purok Mangga',
    code: 'MANGGA-03',
    color: '#F97316',
    fillColor: 'rgba(249, 115, 22, 0.32)',
    strokeColor: '#EA580C',
    darkColor: '#9A3412',
    textColor: 'text-orange-900',
    bgLight: 'bg-orange-50 border-orange-200',
    tagline: 'Barangay Administrative, Health & Educational Civic Center',
    landArea: '18.5 Hectares',
    elevation: '56 meters ASL',
    boundaryNotes: 'Central crossroads of Sangkol National Highway and East-West Connector',
    purokLeader: 'Hon. Rodrigo M. Sangkol / Kgd. Jocelyn M. Fernandez',
    purokLeaderContact: '0917-555-1234',
    tanodLead: 'Chief Tanod Alberto D. Valenzuela',
    tanodContact: '0917-911-0000',
    healthWorker: 'Head Nurse Clarissa Gomez & Midwife Alcantara',
    healthWorkerContact: '0917-888-2211',
    description:
      'The central civic heart of Barangay Sangkol, housing the Barangay Hall, Central Health Center, Sangkol Gymnasium, Disaster Evacuation Facility, Sangkol Daycare, and Sangkol Elementary School.',
    centerCoords: [8.4808, 123.3492],
    centerSvg: { x: 370, y: 320 },
    geoPolygon: [
      [8.4825, 123.3465],
      [8.4835, 123.3515],
      [8.4785, 123.3525],
      [8.4770, 123.3470],
    ],
    svgPath: 'M 220 250 L 340 190 L 460 250 L 490 380 L 260 400 L 190 330 Z',
    hazardRisk: 'Low',
  },
  {
    id: 'Purok Tambis',
    name: 'Purok Tambis',
    code: 'TAMBIS-04',
    color: '#06B6D4',
    fillColor: 'rgba(6, 182, 212, 0.25)',
    strokeColor: '#0891B2',
    darkColor: '#164E63',
    textColor: 'text-cyan-900',
    bgLight: 'bg-cyan-50 border-cyan-200',
    tagline: 'West Riverine, Agriculture & Artisan Community Sector',
    landArea: '15.0 Hectares',
    elevation: '48 meters ASL',
    boundaryNotes: 'Traversed by Sangkol River stream, bounded west by Sinaman/Katipunan',
    purokLeader: 'Kgd. Arnaldo B. Santos / Mr. Roberto Tambis',
    purokLeaderContact: '0919-333-2222',
    tanodLead: 'Tanod Efren P. Morales',
    tanodContact: '0919-222-7788',
    healthWorker: 'BHW Jocelyn Bautista',
    healthWorkerContact: '0919-555-6622',
    description:
      'Bordered by the Sangkol / Diwan River stream, Purok Tambis features bamboo craft workshops, vegetable farming cooperatives, riverside tree belts, and community eco-gardens.',
    centerCoords: [8.4780, 123.3420],
    centerSvg: { x: 140, y: 360 },
    geoPolygon: [
      [8.4820, 123.3405],
      [8.4825, 123.3465],
      [8.4770, 123.3470],
      [8.4735, 123.3415],
    ],
    svgPath: 'M 80 230 L 220 250 L 190 330 L 260 400 L 180 500 L 50 420 Z',
    hazardRisk: 'Moderate (River Stream)',
  },
  {
    id: 'Purok Kaimito',
    name: 'Purok Kaimito',
    code: 'KAIMITO-05',
    color: '#10B981',
    fillColor: 'rgba(16, 185, 129, 0.25)',
    strokeColor: '#059669',
    darkColor: '#064E3B',
    textColor: 'text-emerald-900',
    bgLight: 'bg-emerald-50 border-emerald-200',
    tagline: 'Eastern Agro-Forestry & Polanco Border Sector',
    landArea: '16.7 Hectares',
    elevation: '58 meters ASL',
    boundaryNotes: 'Bounded east by Polanco (Anastacio & Bandera agricultural boundaries)',
    purokLeader: 'Kgd. Beatriz C. Villanueva / Mrs. Carmelita Gomez',
    purokLeaderContact: '0923-666-5555',
    tanodLead: 'Tanod Leonardo S. Kaimito',
    tanodContact: '0923-444-1199',
    healthWorker: 'BHW Teresa Mendoza',
    healthWorkerContact: '0923-888-0022',
    description:
      'Purok Kaimito features fruit orchards, mahogany tree lots, poultry farms, community chapels, and peaceful neighborhood clusters along the eastern boundary with Polanco.',
    centerCoords: [8.4785, 123.3560],
    centerSvg: { x: 570, y: 350 },
    geoPolygon: [
      [8.4835, 123.3515],
      [8.4830, 123.3575],
      [8.4740, 123.3585],
      [8.4745, 123.3520],
    ],
    svgPath: 'M 460 250 L 620 220 L 680 360 L 610 510 L 490 380 Z',
    hazardRisk: 'Low',
  },
  {
    id: 'Purok Bayabas',
    name: 'Purok Bayabas',
    code: 'BAYABAS-06',
    color: '#EC4899',
    fillColor: 'rgba(236, 72, 153, 0.25)',
    strokeColor: '#DB2777',
    darkColor: '#831843',
    textColor: 'text-pink-900',
    bgLight: 'bg-pink-50 border-pink-200',
    tagline: 'Southern Upland, Coconut Plantations & Cogon Border Zone',
    landArea: '22.4 Hectares',
    elevation: '68 meters ASL',
    boundaryNotes: 'Bounded south by Brgy. Cogon & Sinaman (corridor towards PSHS-ZRC)',
    purokLeader: 'Kgd. Danilo R. Navarro & Kgd. Ernesto S. Gomez',
    purokLeaderContact: '0922-555-4444',
    tanodLead: 'Tanod Domingo F. Bayabas',
    tanodContact: '0922-777-3311',
    healthWorker: 'BHW Remedios Cruz',
    healthWorkerContact: '0922-666-4400',
    description:
      'The largest territorial zone, Purok Bayabas spans elevated rolling terrain, coconut and corn plantations, livestock farms, and rural trail access towards Cogon and the Zamboanga Peninsula science campus corridor.',
    centerCoords: [8.4720, 123.3490],
    centerSvg: { x: 380, y: 490 },
    geoPolygon: [
      [8.4770, 123.3470],
      [8.4785, 123.3525],
      [8.4745, 123.3520],
      [8.4740, 123.3585],
      [8.4660, 123.3560],
      [8.4650, 123.3450],
      [8.4735, 123.3415],
    ],
    svgPath: 'M 260 400 L 490 380 L 610 510 L 460 620 L 220 590 L 180 500 Z',
    hazardRisk: 'Moderate (Upland Slope)',
  },
];

const SANGKOL_LANDMARKS: LandmarkData[] = [
  {
    id: 'LM-001',
    name: 'Barangay Sangkol Hall Complex',
    purok: 'Purok Mangga',
    type: 'hall',
    coords: [8.4808, 123.3492],
    svgCoords: { x: 360, y: 280 },
    description: 'Executive Office, Sangguniang Barangay Session Hall, Lupon Desk & BDRRMC Command',
    head: 'Hon. Rodrigo M. Sangkol (Punong Barangay)',
    contact: '(065) 212-3456 / 0917-555-1234',
  },
  {
    id: 'LM-002',
    name: 'Sangkol Primary Health Center',
    purok: 'Purok Mangga',
    type: 'health',
    coords: [8.4812, 123.3498],
    svgCoords: { x: 410, y: 310 },
    description: 'Outpatient consultation, immunization, maternal health, medicine dispensing',
    head: 'Clarissa Gomez, RN / Dr. M. Alcantara',
    contact: '0917-888-2211',
  },
  {
    id: 'LM-003',
    name: 'Sangkol Central Covered Court & Gym',
    purok: 'Purok Mangga',
    type: 'court',
    coords: [8.4801, 123.3502],
    svgCoords: { x: 310, y: 330 },
    description: 'Community assemblies, sports leagues, cultural events & secondary evacuation area',
    head: 'SK Chairman / Sports Committee',
  },
  {
    id: 'LM-004',
    name: 'Sangkol Elementary School',
    purok: 'Purok Mangga',
    type: 'school',
    coords: [8.4795, 123.3485],
    svgCoords: { x: 260, y: 310 },
    description: 'DepEd Dipolog City South District - Kinder to Grade 6 academic campus',
    head: 'School Principal Office',
  },
  {
    id: 'LM-005',
    name: 'MDRRMO Evacuation & Relief Center',
    purok: 'Purok Mangga',
    type: 'evacuation',
    coords: [8.4818, 123.3488],
    svgCoords: { x: 420, y: 360 },
    description: 'Emergency disaster shelter, solar power backup, clean water supply & emergency storage',
    head: 'BDRRMC Response Unit',
    contact: '0917-911-0000',
  },
  {
    id: 'LM-006',
    name: 'Pinya Tanod Outpost & Daycare',
    purok: 'Purok Pinya',
    type: 'tanod',
    coords: [8.4862, 123.3442],
    svgCoords: { x: 190, y: 130 },
    description: 'Northern sector peace outpost, early childhood education center',
    head: 'Tanod Rogelio M. Santos',
    contact: '0920-111-4433',
  },
  {
    id: 'LM-007',
    name: 'San Isidro Labrador Chapel',
    purok: 'Purok Pinya',
    type: 'chapel',
    coords: [8.4870, 123.3465],
    svgCoords: { x: 260, y: 100 },
    description: 'Community religious center and feast venue',
  },
  {
    id: 'LM-008',
    name: 'Lumboy Multi-Purpose Court & Outpost',
    purok: 'Purok Lumboy',
    type: 'court',
    coords: [8.4865, 123.3540],
    svgCoords: { x: 470, y: 120 },
    description: 'Recreation venue & Polanco boundary monitoring station',
    head: 'Tanod Victor A. Lumboy',
    contact: '0918-999-5544',
  },
  {
    id: 'LM-009',
    name: 'Tambis Riverside Outpost & Hydrological Post',
    purok: 'Purok Tambis',
    type: 'river',
    coords: [8.4775, 123.3418],
    svgCoords: { x: 130, y: 320 },
    description: 'Sangkol River water level sensor station & flood warning alert sirens',
    head: 'Tanod Efren P. Morales',
    contact: '0919-222-7788',
  },
  {
    id: 'LM-010',
    name: 'Kaimito Eco-Community Outpost',
    purok: 'Purok Kaimito',
    type: 'tanod',
    coords: [8.4788, 123.3565],
    svgCoords: { x: 620, y: 310 },
    description: 'Agro-forestry community pavilion & sector watchdesk',
    head: 'Tanod Leonardo S. Kaimito',
    contact: '0923-444-1199',
  },
  {
    id: 'LM-011',
    name: 'Bayabas Upland Farmers Center & Patrol Desk',
    purok: 'Purok Bayabas',
    type: 'agri',
    coords: [8.4715, 123.3495],
    svgCoords: { x: 360, y: 540 },
    description: 'Farmers training outpost, solar dryer, elevated water reservoir & Cogon corridor patrol',
    head: 'Tanod Domingo F. Bayabas',
    contact: '0922-777-3311',
  },
];

type MapViewMode = 'satellite' | 'cadastral' | 'topo' | 'osm';

export const BarangayMapView: React.FC = () => {
  const {
    residents,
    households,
    officials,
    announcements,
    activities,
    businesses,
    blotters,
    settings,
    currentUser,
    setActiveModule,
    arePuroksMatching,
  } = useBarangay();

  // Selected Purok (default: Purok Mangga or resident's own purok)
  const defaultPurokId =
    currentUser.role === 'Resident' &&
    currentUser.purok &&
    PUROK_DEFINITIONS.some((p) => p.name === currentUser.purok)
      ? currentUser.purok
      : 'Purok Mangga';

  const [selectedPurokId, setSelectedPurokId] = useState<string>(defaultPurokId);
  const [hoveredPurokId, setHoveredPurokId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'landmarks' | 'announcements' | 'hazards'>('all');
  const [mapMode, setMapMode] = useState<MapViewMode>('satellite');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkData | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Leaflet Map Ref
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayersRef = useRef<{ [key: string]: L.Polygon }>({});
  const markerLayersRef = useRef<L.LayerGroup | null>(null);

  const selectedPurok = useMemo(
    () => PUROK_DEFINITIONS.find((p) => p.id === selectedPurokId) || PUROK_DEFINITIONS[2],
    [selectedPurokId]
  );

  // Filtered landmarks based on search query
  const filteredLandmarks = useMemo(() => {
    if (!searchFilter.trim()) return SANGKOL_LANDMARKS;
    const q = searchFilter.toLowerCase().trim();
    return SANGKOL_LANDMARKS.filter(
      (lm) =>
        lm.name.toLowerCase().includes(q) ||
        lm.purok.toLowerCase().includes(q) ||
        lm.description.toLowerCase().includes(q)
    );
  }, [searchFilter]);

  // Statistics calculation for all puroks
  const purokStats = useMemo(() => {
    return PUROK_DEFINITIONS.map((purok) => {
      const purokResidents = residents.filter(
        (r) => arePuroksMatching(r.purok, purok.name) && r.residentStatus === 'Active'
      );
      const purokHouseholds = households.filter((h) => arePuroksMatching(h.purok, purok.name));
      const purokBusinesses = businesses.filter((b) => arePuroksMatching(b.purok, purok.name));
      const purokVoters = purokResidents.filter((r) => String(r.voterStatus || '').toLowerCase() === 'registered').length;
      const purokSeniors = purokResidents.filter((r) => r.isSeniorCitizen || r.age >= 60).length;
      const purokPwds = purokResidents.filter((r) => r.isPWD).length;
      const purokBlotters = blotters.filter(
        (b) => arePuroksMatching(b.incidentPurok, purok.name) || arePuroksMatching(b.purok, purok.name) || arePuroksMatching(b.respondentAddress, purok.name)
      );

      const purokAnnouncements = announcements.filter(
        (a) => a.status === 'Active' && (a.targetPurok === 'All Puroks' || arePuroksMatching(a.targetPurok, purok.name))
      );

      const assignedOfficials = officials.filter(
        (o) => arePuroksMatching(o.purok, purok.name) || o.position.includes('Captain') || o.committee?.includes('General')
      );

      const purokActivities = activities.filter(
        (act) => act.targetPurok === 'All Puroks' || arePuroksMatching(act.targetPurok, purok.name) || arePuroksMatching(act.venue, purok.name)
      );

      const leaderName =
        purok.name === 'Purok Mangga'
          ? `${settings.punongBarangay} / Kgd. Jocelyn M. Fernandez`
          : purok.purokLeader;
      const leaderContact =
        purok.name === 'Purok Mangga'
          ? settings.contactNumber || purok.purokLeaderContact
          : purok.purokLeaderContact;

      return {
        ...purok,
        purokLeader: leaderName,
        purokLeaderContact: leaderContact,
        residentCount: purokResidents.length,
        householdCount: purokHouseholds.length,
        businessCount: purokBusinesses.length,
        votersCount: purokVoters,
        seniorsCount: purokSeniors,
        pwdsCount: purokPwds,
        blotterCount: purokBlotters.length,
        announcementsCount: purokAnnouncements.length,
        activitiesCount: purokActivities.length,
        assignedOfficials,
        announcements: purokAnnouncements,
        activities: purokActivities,
      };
    });
  }, [residents, households, businesses, blotters, announcements, activities, officials, settings]);

  const selectedStats = useMemo(() => {
    return purokStats.find((p) => p.id === selectedPurokId) || purokStats[2];
  }, [purokStats, selectedPurokId]);

  const totalBarangayPopulation = residents.filter((r) => r.residentStatus === 'Active').length;
  const totalBarangayHouseholds = households.length;

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: SANGKOL_CENTER,
        zoom: 15,
        minZoom: 13,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: false,
      });

      leafletMapRef.current = map;

      // Add Zoom Control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Create Layer Groups
      const markerGroup = L.layerGroup().addTo(map);
      markerLayersRef.current = markerGroup;
    }

    const map = leafletMapRef.current;
    if (!map) return;

    // Tile URLs based on selected mode
    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let maxNativeZoom = 19;

    if (mapMode === 'satellite') {
      // High-resolution Esri World Imagery (Real Satellite view)
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxNativeZoom = 19;
    } else if (mapMode === 'osm') {
      // Standard OpenStreetMap
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}.png';
      maxNativeZoom = 19;
    } else if (mapMode === 'topo') {
      // OpenTopoMap Elevation & Topography
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      maxNativeZoom = 17;
    }

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      maxNativeZoom: maxNativeZoom,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);
    tileLayerRef.current = newTileLayer;

    // Draw Purok Boundary Polygons
    Object.values(polygonLayersRef.current).forEach((poly) => map.removeLayer(poly));
    polygonLayersRef.current = {};

    PUROK_DEFINITIONS.forEach((purok) => {
      const isSelected = selectedPurokId === purok.id;
      const polygon = L.polygon(purok.geoPolygon, {
        color: isSelected ? '#FFFFFF' : purok.strokeColor,
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.85,
        fillColor: purok.color,
        fillOpacity: isSelected ? 0.38 : 0.18,
        dashArray: isSelected ? undefined : '4, 4',
      }).addTo(map);

      polygon.bindTooltip(
        `<strong>${purok.name}</strong><br/><span style="font-size: 11px;">${purok.landArea} • ${purok.code}</span>`,
        {
          permanent: false,
          direction: 'center',
          className: 'custom-leaflet-tooltip',
        }
      );

      polygon.on('click', () => {
        setSelectedPurokId(purok.id);
      });

      polygonLayersRef.current[purok.id] = polygon;
    });

    // Populate Landmark Markers
    if (markerLayersRef.current) {
      markerLayersRef.current.clearLayers();

      SANGKOL_LANDMARKS.forEach((lm) => {
        const isSelected = selectedLandmark?.id === lm.id;
        const iconHtml = `
          <div style="
            background: ${lm.type === 'hall' ? '#4F46E5' : lm.type === 'health' ? '#DC2626' : lm.type === 'school' ? '#059669' : lm.type === 'court' ? '#EA580C' : lm.type === 'river' ? '#0284C7' : '#0F172A'};
            color: #FFFFFF;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            border-radius: 9999px;
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
          ">
            ${lm.type === 'hall' ? '🏛️' : lm.type === 'health' ? '🏥' : lm.type === 'school' ? '🏫' : lm.type === 'court' ? '🏀' : lm.type === 'river' ? '🌊' : '📍'}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'leaflet-custom-marker',
          iconSize: [30, 30],
        });

        const marker = L.marker(lm.coords, { icon: customIcon });

        marker.bindPopup(
          `
          <div style="font-family: sans-serif; padding: 2px; max-width: 220px;">
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #4F46E5; margin-bottom: 2px;">
              ${lm.purok}
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0F172A; line-height: 1.2; margin-bottom: 4px;">
              ${lm.name}
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 6px;">
              ${lm.description}
            </div>
            ${lm.contact ? `<div style="font-size: 10px; font-weight: bold; color: #16A34A;">📞 ${lm.contact}</div>` : ''}
            <div style="font-size: 9px; color: #94A3B8; margin-top: 4px;">
              GPS: ${lm.coords[0].toFixed(4)}°N, ${lm.coords[1].toFixed(4)}°E
            </div>
          </div>
        `,
          { closeButton: true }
        );

        marker.on('click', () => {
          setSelectedLandmark(lm);
          setSelectedPurokId(lm.purok);
        });

        markerLayersRef.current?.addLayer(marker);
      });
    }

    // Trigger map invalidation to ensure tiles fill container
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [mapMode, selectedPurokId, selectedLandmark]);

  // When selected purok changes, pan to it smoothly on Leaflet map
  useEffect(() => {
    if (leafletMapRef.current && selectedPurok) {
      leafletMapRef.current.flyTo(selectedPurok.centerCoords, 16, {
        duration: 1.2,
      });
    }
  }, [selectedPurokId]);

  // Focus on specific landmark
  const handleFocusLandmark = (lm: LandmarkData) => {
    setSelectedLandmark(lm);
    setSelectedPurokId(lm.purok);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(lm.coords, 17, { duration: 1.2 });
    }
  };

  // Reset to Barangay Center
  const handleResetMapCenter = () => {
    setSelectedLandmark(null);
    setSelectedPurokId('Purok Mangga');
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(SANGKOL_CENTER, 15, { duration: 1 });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Authoritative Geographic Information System</span>
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Navigation className="w-3 h-3 text-emerald-400" />
                <span>{SANGKOL_CITY}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
              <span>Barangay Sangkol Official Map</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                8.4803° N, 123.3490° E
              </span>
              <InfoButton
                title="Barangay GIS & Official Map"
                info="Real satellite imagery, cadastral purok zoning boundaries, key public facilities, road networks, and demographics covering Purok Pinya, Lumboy, Mangga, Tambis, Kaimito, and Bayabas."
                variant="dark"
              />
            </h1>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 shrink-0">
            <div className="text-center px-3 border-r border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Residents</p>
              <p className="text-lg font-black text-white">{totalBarangayPopulation.toLocaleString()}</p>
            </div>
            <div className="text-center px-3 border-r border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400">Households</p>
              <p className="text-lg font-black text-indigo-300">{totalBarangayHouseholds}</p>
            </div>
            <div className="text-center px-3 border-r border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400">Land Area</p>
              <p className="text-lg font-black text-emerald-400">99.6 Ha</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] uppercase font-bold text-slate-400">Elevation</p>
              <p className="text-xs font-black text-amber-300">{SANGKOL_ELEVATION}</p>
            </div>
          </div>
        </div>

        {/* Quick Purok Selection Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold text-slate-400 shrink-0 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Select Sector:</span>
          </span>
          {PUROK_DEFINITIONS.map((purok) => {
            const isSelected = selectedPurokId === purok.id;
            const stat = purokStats.find((s) => s.id === purok.id);

            return (
              <button
                key={purok.id}
                onClick={() => {
                  setSelectedPurokId(purok.id);
                  setSelectedLandmark(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-950 shadow-lg scale-105 ring-2 ring-indigo-400 font-black'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: purok.color }}></span>
                <span>{purok.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-slate-200 text-slate-800' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {stat?.residentCount || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Purok Intelligence Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* MAP COLUMN (7 Cols on XL) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 relative">
            {/* Map Mode Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {mapMode === 'satellite' && 'High-Res Satellite Imagery (Esri World)'}
                  {mapMode === 'cadastral' && 'Cadastral & Purok Zoning Vector Map'}
                  {mapMode === 'topo' && 'Topographic Elevation & Contour Map'}
                  {mapMode === 'osm' && 'OpenStreetMap Street & Infrastructure Map'}
                </h3>
              </div>

              {/* Map Layer Switcher & Mode Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => setMapMode('satellite')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      mapMode === 'satellite' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'hover:text-slate-900'
                    }`}
                  >
                    <Satellite className="w-3.5 h-3.5" />
                    <span>Satellite</span>
                  </button>
                  <button
                    onClick={() => setMapMode('cadastral')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      mapMode === 'cadastral' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Cadastral</span>
                  </button>
                  <button
                    onClick={() => setMapMode('topo')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      mapMode === 'topo' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'hover:text-slate-900'
                    }`}
                  >
                    <Mountain className="w-3.5 h-3.5" />
                    <span>Topo</span>
                  </button>
                  <button
                    onClick={() => setMapMode('osm')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      mapMode === 'osm' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'hover:text-slate-900'
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Street</span>
                  </button>
                </div>

                <button
                  onClick={handleResetMapCenter}
                  className="p-2 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  title="Recenter Map to Barangay Center"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MAP STAGE CONTAINER */}
            <div className="relative w-full aspect-[4/3] min-h-[460px] max-h-[560px] bg-slate-950 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
              {/* LEAFLET SATELLITE / TOPO / STREET MAP CANVAS */}
              <div
                ref={mapContainerRef}
                className={`w-full h-full ${mapMode === 'cadastral' ? 'hidden' : 'block'}`}
                style={{ zIndex: 1 }}
              />

              {/* CADASTRAL SVG SCHEMATIC VECTOR MODE */}
              {mapMode === 'cadastral' && (
                <div className="relative w-full h-full bg-gradient-to-b from-slate-50 via-sky-50/20 to-slate-100 overflow-hidden flex items-center justify-center p-2">
                  <svg
                    viewBox="0 0 720 680"
                    className="w-full h-full transition-transform duration-300 select-none cursor-pointer"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <defs>
                      <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.75" />
                      </pattern>

                      {PUROK_DEFINITIONS.map((p) => (
                        <radialGradient key={p.id} id={`grad-${p.id}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={p.color} stopOpacity="0.42" />
                          <stop offset="100%" stopColor={p.color} stopOpacity="0.16" />
                        </radialGradient>
                      ))}

                      <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.18" floodColor="#0F172A" />
                      </filter>
                    </defs>

                    {/* Base Grid Background */}
                    <rect width="720" height="680" fill="url(#gridPattern)" />

                    {/* Sangkol / Diwan River Waterway Stream */}
                    <path
                      d="M 20 220 Q 150 260 210 320 T 320 440 T 450 490 T 590 620"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeOpacity="0.45"
                    />
                    <path
                      d="M 20 220 Q 150 260 210 320 T 320 440 T 450 490 T 590 620"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      strokeOpacity="0.8"
                    />
                    <text x="60" y="270" fill="#0284C7" fontSize="10" fontWeight="bold" fontStyle="italic">
                      Sangkol River & Drainage Stream
                    </text>

                    {/* Sangkol National Highway / Provincial Artery */}
                    <path
                      d="M 310 30 L 370 280 L 410 440 L 460 660"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeOpacity="0.35"
                    />
                    <path
                      d="M 310 30 L 370 280 L 410 440 L 460 660"
                      fill="none"
                      stroke="#F8FAFC"
                      strokeWidth="2"
                      strokeDasharray="8 6"
                      strokeOpacity="0.9"
                    />
                    <text
                      x="385"
                      y="210"
                      fill="#334155"
                      fontSize="9"
                      fontWeight="bold"
                      transform="rotate(75, 385, 210)"
                    >
                      Dipolog-Polanco-Sangkol Highway
                    </text>

                    {/* East-West Connector Feeder Road */}
                    <path
                      d="M 60 250 L 360 280 L 670 290"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeOpacity="0.5"
                    />

                    {/* Purok Polygonal Shapes */}
                    {PUROK_DEFINITIONS.map((purok) => {
                      const isSelected = selectedPurokId === purok.id;
                      const isHovered = hoveredPurokId === purok.id;
                      const stat = purokStats.find((s) => s.id === purok.id);

                      return (
                        <g
                          key={purok.id}
                          onClick={() => setSelectedPurokId(purok.id)}
                          onMouseEnter={() => setHoveredPurokId(purok.id)}
                          onMouseLeave={() => setHoveredPurokId(null)}
                          className="cursor-pointer transition-all duration-200"
                        >
                          <path
                            d={purok.svgPath}
                            fill={
                              isSelected
                                ? `url(#grad-${purok.id})`
                                : isHovered
                                ? purok.fillColor
                                : 'rgba(241, 245, 249, 0.78)'
                            }
                            stroke={isSelected ? purok.strokeColor : isHovered ? purok.color : '#CBD5E1'}
                            strokeWidth={isSelected ? '4' : isHovered ? '3' : '1.75'}
                            filter={isSelected ? 'url(#shadowFilter)' : undefined}
                            className="transition-all duration-300"
                          />

                          {/* Center Label Pill */}
                          <g transform={`translate(${purok.centerSvg.x}, ${purok.centerSvg.y})`}>
                            <rect
                              x="-65"
                              y="-20"
                              width="130"
                              height="40"
                              rx="12"
                              fill={isSelected ? '#0F172A' : '#FFFFFF'}
                              stroke={isSelected ? purok.color : '#E2E8F0'}
                              strokeWidth={isSelected ? '2.5' : '1'}
                              filter="url(#shadowFilter)"
                              className="transition-all"
                            />
                            <text
                              x="0"
                              y="-3"
                              textAnchor="middle"
                              fill={isSelected ? '#FFFFFF' : '#0F172A'}
                              fontSize="12"
                              fontWeight="bold"
                              fontFamily="sans-serif"
                            >
                              {purok.name}
                            </text>
                            <text
                              x="0"
                              y="12"
                              textAnchor="middle"
                              fill={isSelected ? '#38BDF8' : '#64748B'}
                              fontSize="9.5"
                              fontWeight="600"
                            >
                              {stat?.residentCount || 0} Residents • {stat?.householdCount || 0} HH
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Cadastral Landmark Points */}
                    {SANGKOL_LANDMARKS.map((lm) => {
                      const isSelected = selectedLandmark?.id === lm.id;
                      return (
                        <g
                          key={lm.id}
                          transform={`translate(${lm.svgCoords.x}, ${lm.svgCoords.y})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusLandmark(lm);
                          }}
                          className="cursor-pointer"
                        >
                          <circle
                            r={isSelected ? 10 : 7}
                            fill={
                              lm.type === 'hall'
                                ? '#4F46E5'
                                : lm.type === 'health'
                                ? '#DC2626'
                                : lm.type === 'school'
                                ? '#059669'
                                : lm.type === 'court'
                                ? '#EA580C'
                                : '#0284C7'
                            }
                            stroke="#FFFFFF"
                            strokeWidth="2.5"
                          />
                          <text
                            x="0"
                            y="18"
                            textAnchor="middle"
                            fill="#0F172A"
                            fontSize="8.5"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {lm.name.slice(0, 18)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Compass Rose */}
                    <g transform="translate(660, 60)">
                      <circle r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                      <path d="M 0 -16 L 5 0 L 0 5 L -5 0 Z" fill="#DC2626" />
                      <path d="M 0 16 L 5 0 L 0 -5 L -5 0 Z" fill="#64748B" />
                      <text x="0" y="-7" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="bold">
                        N
                      </text>
                      <text x="0" y="13" textAnchor="middle" fill="#64748B" fontSize="7" fontWeight="bold">
                        S
                      </text>
                    </g>
                  </svg>
                </div>
              )}

              {/* Floating Real-Time GPS Coordinates & Scale HUD */}
              <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg text-white space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-300">
                    GPS Coordinates
                  </p>
                </div>
                <p className="text-xs font-mono font-black text-emerald-300">
                  {selectedLandmark
                    ? `${selectedLandmark.coords[0].toFixed(4)}°N, ${selectedLandmark.coords[1].toFixed(4)}°E`
                    : `${selectedPurok.centerCoords[0].toFixed(4)}°N, ${selectedPurok.centerCoords[1].toFixed(4)}°E`}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {selectedPurok.elevation} • {selectedPurok.name}
                </p>
              </div>

              {/* Floating External Mapping Shortcut Pills */}
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps?q=${SANGKOL_CENTER[0]},${SANGKOL_CENTER[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-xl border border-slate-200 shadow-md text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${SANGKOL_CENTER[0]}&mlon=${SANGKOL_CENTER[1]}#map=16/${SANGKOL_CENTER[0]}/${SANGKOL_CENTER[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-xl border border-slate-700 shadow-md text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>OpenStreetMap</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Quick Landmark Quick-Select Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Key Public Facilities & Outposts ({SANGKOL_LANDMARKS.length})</span>
                </span>
                <span className="text-[11px] text-slate-500">Click to locate</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {SANGKOL_LANDMARKS.map((lm) => {
                  const isSelected = selectedLandmark?.id === lm.id;
                  return (
                    <button
                      key={lm.id}
                      onClick={() => handleFocusLandmark(lm)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md font-black scale-105'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80'
                      }`}
                    >
                      <span>
                        {lm.type === 'hall'
                          ? '🏛️'
                          : lm.type === 'health'
                          ? '🏥'
                          : lm.type === 'school'
                          ? '🏫'
                          : lm.type === 'court'
                          ? '🏀'
                          : lm.type === 'river'
                          ? '🌊'
                          : '📍'}
                      </span>
                      <span>{lm.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Sector Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {purokStats.map((p) => {
                const isSelected = selectedPurokId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPurokId(p.id);
                      setSelectedLandmark(null);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                        : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{p.name}</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] opacity-80">
                      <span>{p.residentCount} Residents</span>
                      <span>{p.landArea}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* DETAILS & INTELLIGENCE PANEL (5 Cols on XL) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            {/* Sector Header Profile */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                      style={{ backgroundColor: selectedPurok.color }}
                    >
                      {selectedPurok.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{selectedPurok.landArea}</span>
                    <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                      {selectedPurok.elevation}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{selectedPurok.name}</h2>
                  <p className="text-xs text-slate-600 font-medium">{selectedPurok.tagline}</p>
                </div>

                <button
                  onClick={() => {
                    setActiveModule('residents');
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>View Roster</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedPurok.description}
              </p>

              {/* Boundary / Geographic note */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cadastral Boundary Note:</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{selectedPurok.boundaryNotes}</p>
                </div>
              </div>
            </div>

            {/* Selected Landmark Focus Card if active */}
            {selectedLandmark && (
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-black uppercase">
                    Active Landmark Focus
                  </span>
                  <button
                    onClick={() => setSelectedLandmark(null)}
                    className="text-xs text-slate-500 hover:text-slate-900 font-bold"
                  >
                    Clear
                  </button>
                </div>
                <h3 className="text-sm font-black text-slate-900">{selectedLandmark.name}</h3>
                <p className="text-xs text-slate-600">{selectedLandmark.description}</p>
                {selectedLandmark.head && (
                  <p className="text-[11px] text-indigo-900 font-bold">Officer in Charge: {selectedLandmark.head}</p>
                )}
                {selectedLandmark.contact && (
                  <p className="text-[11px] text-emerald-700 font-bold">Hotline: {selectedLandmark.contact}</p>
                )}
              </div>
            )}

            {/* Demographic Metric Tiles */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-center">
                <Users className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold uppercase text-slate-500">Population</p>
                <p className="text-base font-black text-indigo-950">{selectedStats.residentCount}</p>
              </div>
              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-center">
                <Home className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold uppercase text-slate-500">Households</p>
                <p className="text-base font-black text-purple-950">{selectedStats.householdCount}</p>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
                <Store className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold uppercase text-slate-500">Businesses</p>
                <p className="text-base font-black text-emerald-950">{selectedStats.businessCount}</p>
              </div>
            </div>

            {/* Assigned Barangay Officials & Leaders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Assigned Officials & Sector Desks
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Duty Assignment</span>
              </div>

              <div className="space-y-2">
                {/* Purok Leader Card */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                      PL
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedPurok.purokLeader}</p>
                      <p className="text-[10px] text-slate-500">Purok President / Assigned Kagawad</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${selectedPurok.purokLeaderContact}`}
                    className="p-2 bg-white hover:bg-emerald-50 text-emerald-600 rounded-xl border border-slate-200 shadow-xs transition-colors shrink-0"
                    title="Call Leader"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Tanod Outpost Leader */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                      <Shield className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedPurok.tanodLead}</p>
                      <p className="text-[10px] text-slate-500">Peace & Order / Tanod Sector Commander</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${selectedPurok.tanodContact}`}
                    className="p-2 bg-white hover:bg-blue-50 text-blue-600 rounded-xl border border-slate-200 shadow-xs transition-colors shrink-0"
                    title="Call Tanod Hotline"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Barangay Health Worker (BHW) */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
                      <HeartPulse className="w-4 h-4 text-rose-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedPurok.healthWorker}</p>
                      <p className="text-[10px] text-slate-500">Barangay Health Worker (BHW) Sector Desk</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${selectedPurok.healthWorkerContact}`}
                    className="p-2 bg-white hover:bg-rose-50 text-rose-600 rounded-xl border border-slate-200 shadow-xs transition-colors shrink-0"
                    title="Call Health Worker"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Purok Hazard & Disaster Vulnerability Status */}
            <div className="p-3.5 rounded-2xl border bg-slate-50 border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Disaster Vulnerability Assessment</span>
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    selectedPurok.hazardRisk.includes('Moderate')
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {selectedPurok.hazardRisk}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                {selectedPurok.name === 'Purok Tambis' &&
                  'Monitored 24/7 during heavy rainfalls due to proximity to the Sangkol River water level sensor station.'}
                {selectedPurok.name === 'Purok Bayabas' &&
                  'Elevated rolling terrain. Monitored for soil stability and rural road runoff during typhoon seasons.'}
                {selectedPurok.name !== 'Purok Tambis' &&
                  selectedPurok.name !== 'Purok Bayabas' &&
                  'Low flood hazard profile with well-maintained concrete drainage channels along the main highway.'}
              </p>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={() => {
                  if (currentUser.role === 'Resident') {
                    setActiveModule('resident_portal');
                  } else {
                    setActiveModule('announcements');
                  }
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors text-center cursor-pointer shadow-xs"
              >
                {currentUser.role === 'Resident'
                  ? 'File a Concern for this Sector'
                  : 'Post Advisory to this Sector'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
