import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Crosshair,
  Globe2,
  Home,
  Layers,
  Mountain,
  PhoneCall,
  Plus,
  Save,
  Satellite,
  Store,
  Users,
  X,
} from 'lucide-react';
import L from 'leaflet';
import { useBarangay } from '../context/BarangayContext';
import { InfoButton } from '../components/InfoButton';

type MapMode = 'satellite' | 'street' | 'topo' | 'cadastral';
type Coordinates = [number, number];

const BARANGAY_CENTER: Coordinates = [8.4803, 123.3490];
const PUROK_COLORS = ['#4f46e5', '#0891b2', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#0f766e', '#ea580c'];

export const BarangayMapView: React.FC = () => {
  const {
    residents,
    households,
    officials,
    businesses,
    blotters,
    complaints,
    announcements,
    activities,
    users,
    settings,
    currentUser,
    updateSettings,
    updateResident,
    updateHousehold,
    updateOfficial,
    updateBusiness,
    updateBlotter,
    updateComplaint,
    updateAnnouncement,
    updateActivity,
    updateUser,
    setActiveModule,
    arePuroksMatching,
  } = useBarangay();

  const puroks = settings.puroks || [];
  const boundaries = settings.purokMapBoundaries || [];
  const canManage = currentUser.role !== 'Resident';
  const [selectedPurok, setSelectedPurok] = useState('');
  const [mapMode, setMapMode] = useState<MapMode>('satellite');
  const [newPurokName, setNewPurokName] = useState('');
  const [renamedPurokName, setRenamedPurokName] = useState('');
  const [drawingPurok, setDrawingPurok] = useState<string | null>(null);
  const [draftCoordinates, setDraftCoordinates] = useState<Coordinates[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const zoneLayersRef = useRef<L.LayerGroup | null>(null);
  const draftLayerRef = useRef<L.LayerGroup | null>(null);

  const zoneStats = useMemo(
    () =>
      puroks.map((name, index) => {
        const zoneResidents = residents.filter(
          (resident) => resident.residentStatus === 'Active' && arePuroksMatching(resident.purok, name)
        );
        const zoneHouseholds = households.filter((household) => arePuroksMatching(household.purok, name));
        const zoneBusinesses = businesses.filter((business) => arePuroksMatching(business.purok, name));
        const zoneOfficials = officials.filter(
          (official) => official.status === 'Active' && arePuroksMatching(official.purok, name)
        );

        return {
          name,
          color: PUROK_COLORS[index % PUROK_COLORS.length],
          boundary: boundaries.find((item) => item.purok === name)?.coordinates || [],
          residents: zoneResidents.length,
          households: zoneHouseholds.length,
          businesses: zoneBusinesses.length,
          officials: zoneOfficials,
        };
      }),
    [puroks, boundaries, residents, households, businesses, officials, arePuroksMatching]
  );

  const selectedZone = zoneStats.find((zone) => zone.name === selectedPurok) || zoneStats[0];

  useEffect(() => {
    setRenamedPurokName(selectedZone?.name || '');
  }, [selectedZone?.name]);

  useEffect(() => {
    if (puroks.length === 0) {
      setSelectedPurok('');
    } else if (!puroks.includes(selectedPurok)) {
      setSelectedPurok(
        currentUser.purok && puroks.includes(currentUser.purok) ? currentUser.purok : puroks[0]
      );
    }
  }, [puroks, currentUser.purok, selectedPurok]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BARANGAY_CENTER,
      zoom: 15,
      minZoom: 12,
      maxZoom: 20,
      zoomControl: true,
    });
    mapRef.current = map;
    zoneLayersRef.current = L.layerGroup().addTo(map);
    draftLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      zoneLayersRef.current = null;
      draftLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (mapMode === 'cadastral') return;

    const tileUrl =
      mapMode === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : mapMode === 'topo'
        ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 20,
      maxNativeZoom: mapMode === 'topo' ? 17 : 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);
  }, [mapMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawingPurok) return;

    const handleMapClick = (event: L.LeafletMouseEvent) => {
      setDraftCoordinates((points) => [...points, [event.latlng.lat, event.latlng.lng]]);
      setErrorMessage('');
      setSaveMessage('');
    };
    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [drawingPurok]);

  useEffect(() => {
    const zoneLayer = zoneLayersRef.current;
    const draftLayer = draftLayerRef.current;
    if (!zoneLayer || !draftLayer) return;

    zoneLayer.clearLayers();
    draftLayer.clearLayers();

    zoneStats.forEach((zone) => {
      if (zone.boundary.length < 3) return;
      const polygon = L.polygon(zone.boundary, {
        color: zone.color,
        weight: zone.name === selectedPurok ? 4 : 2,
        fillColor: zone.color,
        fillOpacity: zone.name === selectedPurok ? 0.32 : 0.18,
      }).addTo(zoneLayer);
      polygon.bindTooltip(zone.name);
      polygon.on('click', () => setSelectedPurok(zone.name));
    });

    if (draftCoordinates.length > 0) {
      draftCoordinates.forEach((point, index) => {
        L.circleMarker(point, {
          radius: 5,
          color: '#ffffff',
          weight: 2,
          fillColor: '#e11d48',
          fillOpacity: 1,
        })
          .bindTooltip(String(index + 1), { permanent: true, direction: 'top' })
          .addTo(draftLayer);
      });
      if (draftCoordinates.length >= 2) {
        L.polyline(draftCoordinates, {
          color: '#e11d48',
          weight: 3,
          dashArray: '6, 6',
        }).addTo(draftLayer);
      }
    }
  }, [zoneStats, selectedPurok, draftCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedZone?.boundary.length) {
      map.fitBounds(L.latLngBounds(selectedZone.boundary), { padding: [35, 35], maxZoom: 17 });
    } else {
      map.setView(BARANGAY_CENTER, 15);
    }
  }, [selectedPurok, selectedZone?.boundary]);

  const startBoundaryDrawing = (name: string) => {
    setSelectedPurok(name);
    setDrawingPurok(name);
    setDraftCoordinates([]);
    setErrorMessage('');
    setSaveMessage('');
    setMapMode((mode) => (mode === 'cadastral' ? 'street' : mode));
  };

  const cancelBoundaryDrawing = () => {
    setDrawingPurok(null);
    setDraftCoordinates([]);
    setNewPurokName('');
    setErrorMessage('');
  };

  const handleAddPurok = () => {
    const name = newPurokName.trim();
    if (!name) {
      setErrorMessage('Enter a purok name before drawing its boundary.');
      return;
    }
    if (puroks.some((purok) => purok.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('A purok with that name already exists.');
      return;
    }
    startBoundaryDrawing(name);
  };

  const handleSaveBoundary = async () => {
    if (!drawingPurok || draftCoordinates.length < 3) {
      setErrorMessage('Add at least three points on the map to create a boundary.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveMessage('');
    try {
      const isNewPurok = !puroks.includes(drawingPurok);
      const nextPuroks = isNewPurok ? [...puroks, drawingPurok] : puroks;
      const nextBoundaries = boundaries.filter((item) => item.purok !== drawingPurok);
      nextBoundaries.push({ purok: drawingPurok, coordinates: draftCoordinates });
      await updateSettings({ puroks: nextPuroks, purokMapBoundaries: nextBoundaries });
      setSelectedPurok(drawingPurok);
      setDrawingPurok(null);
      setDraftCoordinates([]);
      setNewPurokName('');
      setSaveMessage(`Boundary saved for ${drawingPurok}.`);
    } catch (error) {
      console.error('Failed to save purok map boundary:', error);
      setErrorMessage('Could not save the purok boundary. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignOfficial = (officialId: string) => {
    if (!selectedZone || !officialId) return;
    updateOfficial(officialId, { purok: selectedZone.name });
  };

  const handleRenamePurok = async () => {
    if (!selectedZone) return;
    const oldName = selectedZone.name;
    const newName = renamedPurokName.trim();
    if (!newName) {
      setErrorMessage('Enter a name for this purok.');
      return;
    }
    if (newName.toLowerCase() !== oldName.toLowerCase() &&
      puroks.some((purok) => purok.toLowerCase() === newName.toLowerCase())) {
      setErrorMessage('A purok with that name already exists.');
      return;
    }
    if (newName === oldName) return;

    setIsSaving(true);
    setErrorMessage('');
    setSaveMessage('');
    try {
      const nextBoundaries = boundaries.map((item) =>
        item.purok === oldName ? { ...item, purok: newName } : item
      );
      await updateSettings({
        puroks: puroks.map((purok) => (purok === oldName ? newName : purok)),
        purokMapBoundaries: nextBoundaries,
      });
      residents.filter((resident) => resident.purok === oldName).forEach((resident) =>
        updateResident(resident.id, { purok: newName })
      );
      households.filter((household) => household.purok === oldName).forEach((household) =>
        updateHousehold(household.id, { purok: newName })
      );
      officials.filter((official) => official.purok === oldName).forEach((official) =>
        updateOfficial(official.id, { purok: newName })
      );
      businesses.filter((business) => business.purok === oldName).forEach((business) =>
        updateBusiness(business.id, { purok: newName })
      );
      blotters
        .filter((record) => record.purok === oldName || record.incidentPurok === oldName)
        .forEach((record) =>
          updateBlotter(record.id, {
            ...(record.purok === oldName ? { purok: newName } : {}),
            ...(record.incidentPurok === oldName ? { incidentPurok: newName } : {}),
          })
        );
      complaints.filter((record) => record.purok === oldName).forEach((record) =>
        updateComplaint(record.id, { purok: newName })
      );
      announcements.filter((record) => record.targetPurok === oldName).forEach((record) =>
        updateAnnouncement(record.id, { targetPurok: newName })
      );
      activities.filter((record) => record.targetPurok === oldName).forEach((record) =>
        updateActivity(record.id, { targetPurok: newName })
      );
      users.filter((user) => user.purok === oldName).forEach((user) =>
        updateUser(user.id, { purok: newName })
      );
      setSelectedPurok(newName);
      setSaveMessage(`Purok renamed to ${newName}.`);
    } catch (error) {
      console.error('Failed to rename purok:', error);
      setErrorMessage('Could not rename the purok. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPopulation = residents.filter((resident) => resident.residentStatus === 'Active').length;

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {settings.barangayName} Purok Map
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Purok names, boundaries, and designated officials are managed by your barangay.
          </p>
        </div>
        <InfoButton
          title="Purok Map"
          info="Purok boundaries are drawn and saved by authorized barangay users. Assign officials to a purok from the map or the Officials page."
          variant="light"
        />
      </header>

      {canManage && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-56 flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">
              Add a purok
              <input
                value={newPurokName}
                onChange={(event) => setNewPurokName(event.target.value)}
                placeholder="Enter the official purok name"
                disabled={Boolean(drawingPurok)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </label>
            <button
              type="button"
              onClick={handleAddPurok}
              disabled={Boolean(drawingPurok)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Draw new purok
            </button>
            {drawingPurok && (
              <>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Click at least 3 points on the map for {drawingPurok}.
                </span>
                <button
                  type="button"
                  onClick={handleSaveBoundary}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save boundary'}
                </button>
                <button
                  type="button"
                  onClick={cancelBoundaryDrawing}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
          {errorMessage && <p role="alert" className="mt-3 text-sm font-semibold text-rose-700">{errorMessage}</p>}
          {saveMessage && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{saveMessage}</p>}
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="space-y-4 xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap gap-2">
              {([
                ['satellite', 'Satellite', Satellite],
                ['street', 'Street', Globe2],
                ['topo', 'Terrain', Mountain],
                ['cadastral', 'Boundaries', Layers],
              ] as const).map(([mode, label, Icon]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMapMode(mode)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${
                    mapMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => mapRef.current?.setView(BARANGAY_CENTER, 15)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
              title="Recenter map"
            >
              <Crosshair className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={mapContainerRef}
            className={`h-[min(68vh,680px)] min-h-[420px] rounded-2xl border border-slate-300 ${
              mapMode === 'cadastral' ? 'bg-slate-100' : 'bg-slate-900'
            }`}
          />
          <p className="text-xs text-slate-500">
            {mapMode === 'cadastral'
              ? 'Boundary-only view. Select a zone or draw a new boundary.'
              : 'Use the map controls to zoom and pan. Draw boundaries by clicking map points in order.'}
          </p>
        </section>

        <aside className="space-y-4 xl:col-span-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
              <Users className="mx-auto mb-1 h-4 w-4 text-indigo-600" />
              <p className="text-[10px] font-bold uppercase text-slate-500">Residents</p>
              <p className="font-black text-slate-900 dark:text-white">{totalPopulation}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
              <Home className="mx-auto mb-1 h-4 w-4 text-violet-600" />
              <p className="text-[10px] font-bold uppercase text-slate-500">Households</p>
              <p className="font-black text-slate-900 dark:text-white">{households.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
              <Store className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
              <p className="text-[10px] font-bold uppercase text-slate-500">Businesses</p>
              <p className="font-black text-slate-900 dark:text-white">{businesses.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-black text-slate-900 dark:text-white">Configured Puroks</h2>
            {zoneStats.length === 0 ? (
              <p className="text-sm text-slate-500">No puroks have been configured yet.</p>
            ) : (
              <div className="space-y-2">
                {zoneStats.map((zone) => (
                  <button
                    key={zone.name}
                    type="button"
                    onClick={() => setSelectedPurok(zone.name)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selectedPurok === zone.name
                        ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <span className="h-3 w-3 rounded-full" style={{ background: zone.color }} />
                        {zone.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {zone.boundary.length >= 3 ? 'Boundary saved' : 'No boundary'}
                      </span>
                    </span>
                    <span className="mt-2 block text-xs text-slate-600 dark:text-slate-300">
                      {zone.residents} residents · {zone.households} households · {zone.businesses} businesses
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedZone && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              {canManage && (
                <div className="mb-4 flex items-end gap-2">
                  <label className="min-w-0 flex-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Purok name
                    <input
                      value={renamedPurokName}
                      onChange={(event) => setRenamedPurokName(event.target.value)}
                      disabled={Boolean(drawingPurok) || isSaving}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRenamePurok}
                    disabled={isSaving || renamedPurokName.trim() === selectedZone.name}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
                  >
                    Rename
                  </button>
                </div>
              )}
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-slate-900 dark:text-white">{selectedZone.name}</h2>
                {canManage && !drawingPurok && (
                  <button
                    type="button"
                    onClick={() => startBoundaryDrawing(selectedZone.name)}
                    className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
                  >
                    Redraw boundary
                  </button>
                )}
              </div>
              <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                <Award className="h-4 w-4 text-amber-600" />
                Designated officials
              </div>
              {selectedZone.officials.length ? (
                <div className="space-y-2">
                  {selectedZone.officials.map((official) => (
                    <div key={official.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{official.name}</p>
                        <p className="text-[10px] text-slate-500">{official.position}</p>
                      </div>
                      {official.contactNumber && (
                        <a
                          href={`tel:${official.contactNumber}`}
                          aria-label={`Call ${official.name}`}
                          className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No active officials are assigned to this purok yet.</p>
              )}
              {canManage && (
                <label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Assign an official
                  <select
                    value=""
                    onChange={(event) => handleAssignOfficial(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select official...</option>
                    {officials
                      .filter((official) => official.purok !== selectedZone.name)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((official) => (
                        <option key={official.id} value={official.id}>
                          {official.name} · {official.position}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                onClick={() => setActiveModule('officials')}
                className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Manage official records
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
