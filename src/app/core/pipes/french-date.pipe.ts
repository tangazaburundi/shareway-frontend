import { Pipe, PipeTransform } from '@angular/core';

/**
 * Affiche les dates en français.
 *
 * Usage :
 *   {{ date | frenchDate }}           → "lundi 9 juin 2025 à 14h30"
 *   {{ date | frenchDate:'short' }}   → "9 juin"
 *   {{ date | frenchDate:'medium' }}  → "lun. 9 juin 2025"
 *   {{ date | frenchDate:'time' }}    → "14h30"
 *   {{ date | frenchDate:'relative'}} → "dans 2 jours" / "il y a 3h"
 *   {{ date | frenchDate:'day' }}     → "Lundi 9 juin"
 */
@Pipe({ name: 'frenchDate', standalone: true })
export class FrenchDatePipe implements PipeTransform {

  private readonly locale = 'fr-FR';

  transform(
    value: string | Date | null | undefined,
    format: 'full' | 'medium' | 'short' | 'time' | 'relative' | 'day' = 'full'
  ): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    switch (format) {
      case 'short':
        return date.toLocaleDateString(this.locale, { day: 'numeric', month: 'long' });

      case 'day':
        return date.toLocaleDateString(this.locale, {
          weekday: 'long', day: 'numeric', month: 'long'
        });

      case 'medium':
        return date.toLocaleDateString(this.locale, {
          weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
        });

      case 'time':
        return date.toLocaleTimeString(this.locale, {
          hour: '2-digit', minute: '2-digit'
        }).replace(':', 'h');

      case 'relative':
        return this.toRelative(date);

      case 'full':
      default: {
        const datePart = date.toLocaleDateString(this.locale, {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        const timePart = date.toLocaleTimeString(this.locale, {
          hour: '2-digit', minute: '2-digit'
        }).replace(':', 'h');
        return `${datePart} à ${timePart}`;
      }
    }
  }

  private toRelative(date: Date): string {
    const now    = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60_000);
    const diffH   = Math.round(diffMs / 3_600_000);
    const diffD   = Math.round(diffMs / 86_400_000);

    if (Math.abs(diffMin) < 60) {
      if (diffMin > 0)  return `dans ${diffMin} min`;
      if (diffMin < 0)  return `il y a ${Math.abs(diffMin)} min`;
      return 'maintenant';
    }
    if (Math.abs(diffH) < 24) {
      return diffH > 0 ? `dans ${diffH}h` : `il y a ${Math.abs(diffH)}h`;
    }
    if (diffD === 1)   return 'demain';
    if (diffD === -1)  return 'hier';
    if (diffD > 1 && diffD < 7) return `dans ${diffD} jours`;
    if (diffD < -1 && diffD > -7) return `il y a ${Math.abs(diffD)} jours`;

    return date.toLocaleDateString(this.locale, {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
