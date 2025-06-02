import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

const bikeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconRetinaUrl: markerRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface StationMapLocation {
  id: string;
  name: string;
  location: { latitude: number; longitude: number } | null;
  type?: 'station' | 'bike';
}

interface StationMapProps {
  stations: StationMapLocation[];
  bikes?: StationMapLocation[];
  selectedStation?: string;
  selectedBike?: string;
  onStationSelect?: (id: string) => void;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

const StationMap = ({ 
  stations, 
  bikes = [], 
  selectedStation, 
  selectedBike, 
  onStationSelect = () => {},
  bounds = {
    minLat: 8.9,
    maxLat: 9.1,
    minLng: 38.6,
    maxLng: 38.9
  }
}: StationMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const bikeMarkersRef = useRef<L.LayerGroup | null>(null);
  const bikeMarkerRefs = useRef<Record<string, L.Marker>>({});

  const mapBounds: L.LatLngBoundsExpression = [
    [bounds.minLat, bounds.minLng],
    [bounds.maxLat, bounds.maxLng]
  ];
  const mapCenter: [number, number] = [9.03, 38.74];
  const zoom = 12;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: mapCenter,
        zoom,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: mapBounds,
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);
      bikeMarkersRef.current = L.layerGroup().addTo(mapRef.current);

      mapRef.current.fitBounds(mapBounds);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    stations.forEach((station) => {
      if (!station.location) return;

      const marker = L.marker(
        [station.location.latitude, station.location.longitude],
        { icon: DefaultIcon }
      ).bindPopup(
        `<div>
          <strong>${station.name}</strong>
          <p>${selectedStation === station.id ? 'Selected Station' : 'Click to select'}</p>
        </div>`
      ).on('click', () => onStationSelect(station.id));

      markersRef.current?.addLayer(marker);
    });
  }, [stations, selectedStation, onStationSelect]);

  useEffect(() => {
    if (!mapRef.current || !bikeMarkersRef.current) return;

    Object.keys(bikeMarkerRefs.current).forEach(bikeId => {
      if (!bikes.some(bike => bike.id === bikeId)) {
        bikeMarkersRef.current?.removeLayer(bikeMarkerRefs.current[bikeId]);
        delete bikeMarkerRefs.current[bikeId];
      }
    });

    bikes.forEach((bike) => {
      if (!bike.location) return;

      if (bikeMarkerRefs.current[bike.id]) {
        bikeMarkerRefs.current[bike.id].setLatLng([
          bike.location.latitude,
          bike.location.longitude
        ]);
      } else {
        const marker = L.marker(
          [bike.location.latitude, bike.location.longitude],
          { 
            icon: bikeIcon,
            zIndexOffset: 1000
          }
        ).bindPopup(
          `<div>
            <strong>${bike.name}</strong>
            <p>Bike in use</p>
          </div>`
        );

        bikeMarkerRefs.current[bike.id] = marker;
        bikeMarkersRef.current?.addLayer(marker);
      }

      if (bike.id === selectedBike) {
        bikeMarkerRefs.current[bike.id].setZIndexOffset(2000);
      } else {
        bikeMarkerRefs.current[bike.id].setZIndexOffset(1000);
      }
    });
  }, [bikes, selectedBike]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedBike) {
      const bike = bikes.find(b => b.id === selectedBike);
      if (bike?.location) {
        const bikeLatLng = L.latLng(bike.location.latitude, bike.location.longitude);
        if (mapRef.current.getBounds().contains(bikeLatLng)) {
          mapRef.current.flyTo(
            bikeLatLng,
            16,
            { animate: true, duration: 1.5 }
          );
        } else {
          const newCenter = mapRef.current.getBounds().pad(0.5).contains(bikeLatLng)
            ? bikeLatLng
            : mapRef.current.getBounds().getCenter();
          mapRef.current.flyTo(
            newCenter,
            16,
            { animate: true, duration: 1.5 }
          );
        }
        return;
      }
    }

    if (selectedStation) {
      const station = stations.find(s => s.id === selectedStation);
      if (station?.location) {
        mapRef.current.flyTo(
          [station.location.latitude, station.location.longitude],
          16,
          { animate: true, duration: 1.5 }
        );
      }
    }
  }, [selectedStation, selectedBike, stations, bikes]);

  return (
    <div
      className="w-full h-full rounded-lg overflow-hidden relative"
      style={{ 
        minHeight: '400px',
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate'
      }}
      ref={mapContainerRef}
    />
  );
};

export default StationMap;