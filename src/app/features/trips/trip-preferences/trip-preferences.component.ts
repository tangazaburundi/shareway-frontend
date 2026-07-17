import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripPreferences } from '../../../core/models/trip.model';

@Component({
  selector: 'app-trip-preferences',
  standalone: true,
  imports: [CommonModule],
   templateUrl: './trip-preferences.component.html',
   styleUrls: ['./trip-preferences.component.css']

})
export class TripPreferencesComponent {
  @Input()  preferences: TripPreferences = this.defaults();
  @Output() preferencesChange = new EventEmitter<TripPreferences>();

  prefList: {
    key:              keyof TripPreferences;
    icon:             string;
    label:            string;
    yes:              string;
    no:               string;
    forbiddenWhenFalse?: boolean;
  }[] = [
    { key: 'music',           icon: '🎵', label: 'Musique',       yes: 'Autorisée',   no: 'Non' },
    { key: 'smoking',         icon: '🚬', label: 'Tabac',         yes: 'Autorisé',    no: 'Interdit',    forbiddenWhenFalse: true },
    { key: 'pets',            icon: '🐾', label: 'Animaux',       yes: 'Autorisés',   no: 'Interdits',   forbiddenWhenFalse: true },
    { key: 'talking',         icon: '💬', label: 'Bavardage',     yes: 'Bienvenu',    no: 'Silencieux' },
    { key: 'airConditioning', icon: '❄️',  label: 'Climatisation', yes: 'Disponible',  no: 'Non' },
    { key: 'smallLuggage',   icon: '🎒', label: 'Petite valise', yes: 'Acceptée',    no: 'Non',         forbiddenWhenFalse: false },
    { key: 'largeLuggage',   icon: '🧳', label: 'Grande valise', yes: 'Acceptée',    no: 'Non',         forbiddenWhenFalse: false },
  ];

  toggle(key: keyof TripPreferences) {
    const updated = { ...this.preferences, [key]: !this.preferences[key] };
    this.preferences = updated;
    this.preferencesChange.emit(updated);
  }

  private defaults(): TripPreferences {
    return {
      music: false, smoking: false, pets: false,
      talking: false, airConditioning: false,
      smallLuggage: false, largeLuggage: false
    };
  }
}
