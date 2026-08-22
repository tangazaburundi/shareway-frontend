import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({ providedIn: 'root' })
export class MapService {
  private maps = new Map<string, L.Map>();
  private markers = new Map<string, L.Marker>();
  private routes = new Map<string, L.Polyline>();

  createMap(containerId: string, lat: number, lng: number, zoom: number = 15): L.Map {
    const existing = this.maps.get(containerId);
    if (existing) {
      existing.remove();
    }

    const map = L.map(containerId, {
      center: [lat, lng],
      zoom,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    this.maps.set(containerId, map);
    return map;
  }

  addMarker(
    map: L.Map,
    lat: number,
    lng: number,
    type: 'pickup' | 'driver' | 'destination' | 'passenger',
    label?: string,
    avatarUrl?: string,
    popupHtml?: string
  ): L.Marker {
    const colors: Record<string, string> = {
      pickup: '#22c55e',
      driver: '#3b82f6',
      destination: '#ef4444',
      passenger: '#8b5cf6'
    };

    const icons: Record<string, string> = {
      pickup: '🟢',
      driver: '🚗',
      destination: '📍',
      passenger: '🧑'
    };

    const size = avatarUrl ? 40 : 32;
    const html = avatarUrl
      ? `<div style="
        width: ${size}px; height: ${size}px; border-radius: 50%;
        border: 3px solid ${colors[type]}; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        overflow: hidden; background: ${colors[type]}; display: flex; align-items: center; justify-content: center;
      "><img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';this.parentNode.innerHTML='${icons[type]}'"/></div>`
      : `<div style="
        background: ${colors[type]};
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">${icons[type]}</div>`;

    const icon = L.divIcon({
      className: 'custom-marker',
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);
    if (popupHtml) {
      marker.bindPopup(popupHtml);
    } else if (label) {
      marker.bindPopup(label).openPopup();
    }

    const markerId = `${type}_${Date.now()}`;
    this.markers.set(markerId, marker);
    return marker;
  }

  updateMarkerPosition(marker: L.Marker, lat: number, lng: number): void {
    marker.setLatLng([lat, lng]);
  }

  drawRoute(map: L.Map, points: [number, number][], color: string = '#3b82f6'): L.Polyline {
    const polyline = L.polyline(points, {
      color,
      weight: 4,
      opacity: 0.8,
      dashArray: undefined
    }).addTo(map);

    return polyline;
  }

  removeRoute(polyline: L.Polyline): void {
    polyline.remove();
  }

  fitBounds(map: L.Map, points: [number, number][], padding: number = 50): void {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [padding, padding] });
  }

  destroyMap(containerId: string): void {
    const map = this.maps.get(containerId);
    if (map) {
      map.remove();
      this.maps.delete(containerId);
    }
  }
}
