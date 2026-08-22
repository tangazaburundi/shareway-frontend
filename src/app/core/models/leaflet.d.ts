declare module 'leaflet' {
  export function map(el: string | HTMLElement, options?: any): Map;
  export function tileLayer(url: string, options?: any): TileLayer;
  export function marker(latlng: [number, number], options?: any): Marker;
  export function latLngBounds(bounds: [number, number][]): LatLngBounds;
  export function divIcon(options?: any): DivIcon;
  export function polyline(points: [number, number][], options?: any): Polyline;

  export class Map {
    constructor(el: string | HTMLElement, options?: any);
    setView(latlng: [number, number], zoom: number): this;
    fitBounds(bounds: LatLngBounds, options?: any): this;
    remove(): void;
  }
  export class TileLayer {
    addTo(map: Map): this;
  }
  export class Marker {
    addTo(map: Map): this;
    setLatLng(latlng: [number, number]): this;
    bindPopup(content: string): this;
    openPopup(): this;
  }
  export class LatLngBounds {
    constructor(bounds?: [number, number][]);
  }
  export class DivIcon {
    constructor(options?: any);
  }
  export class Polyline {
    addTo(map: Map): this;
    remove(): void;
  }
}
