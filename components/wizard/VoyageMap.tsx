'use client';

import { useEffect, useRef } from 'react';
import type { Map, Marker, Polyline } from 'leaflet';
import type { PortCall } from '@/types';
import portsData from '@/data/ports.json';
import type { Port } from '@/types';

const PORTS: Port[] = portsData as Port[];

function getPort(portName: string): Port | undefined {
  return PORTS.find((p) => p.name === portName || p.id === portName);
}

interface Props {
  portRotation: PortCall[];
}

const ROLE_COLORS = {
  load: '#22c55e',
  discharge: '#ef4444',
  transit: '#f59e0b',
};

export function VoyageMap({ portRotation }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const polylinesRef = useRef<Polyline[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function initMap() {
      if (!mapRef.current) return;

      const L = (await import('leaflet')).default;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [30, 20],
          zoom: 2,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB',
          subdomains: 'abcd',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;

      // Clear existing markers and polylines
      markersRef.current.forEach((m) => m.remove());
      polylinesRef.current.forEach((p) => p.remove());
      markersRef.current = [];
      polylinesRef.current = [];

      const validPorts: { portCall: PortCall; port: Port }[] = [];

      portRotation.forEach((pc) => {
        const port = getPort(pc.portName);
        if (!port) return;
        validPorts.push({ portCall: pc, port });

        const color = ROLE_COLORS[pc.role];
        const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
          <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
          <circle cx="12" cy="8" r="3.5" fill="white"/>
        </svg>`;

        const icon = L.divIcon({
          html: svgIcon,
          iconSize: [24, 36],
          iconAnchor: [12, 36],
          popupAnchor: [0, -36],
          className: '',
        });

        const popupContent = `
          <div style="padding:4px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#f1f5f9">${port.name}</div>
            <div style="font-size:11px;color:#94a3b8;text-transform:capitalize;margin-bottom:4px">
              ${pc.role} port · ${port.country}
            </div>
            ${pc.eta ? `<div style="font-size:11px;color:#cbd5e1">ETA: ${pc.eta}</div>` : ''}
            ${pc.etd ? `<div style="font-size:11px;color:#cbd5e1">ETD: ${pc.etd}</div>` : ''}
            ${pc.isBosphorus ? '<div style="font-size:10px;color:#f59e0b;margin-top:2px">⚠ Bosphorus transit</div>' : ''}
            ${pc.isSuez ? '<div style="font-size:10px;color:#f59e0b;margin-top:2px">⚠ Suez transit</div>' : ''}
            ${pc.isDardanelles ? '<div style="font-size:10px;color:#f59e0b;margin-top:2px">⚠ Dardanelles transit</div>' : ''}
          </div>
        `;

        const marker = L.marker([port.lat, port.lng], { icon })
          .addTo(map)
          .bindPopup(popupContent, { maxWidth: 200 });

        markersRef.current.push(marker);
      });

      // Draw polyline connecting ports in order
      if (validPorts.length > 1) {
        const latlngs = validPorts.map(({ port }) => [port.lat, port.lng] as [number, number]);
        const polyline = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
          dashArray: '6, 6',
        }).addTo(map);
        polylinesRef.current.push(polyline);

        const bounds = polyline.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } else if (validPorts.length === 1) {
        map.setView([validPorts[0].port.lat, validPorts[0].port.lng], 5);
      }
    }

    initMap();
  }, [portRotation]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />
  );
}
