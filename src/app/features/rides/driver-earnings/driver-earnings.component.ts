import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-driver-earnings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './driver-earnings.component.html',
  styleUrls: ['./driver-earnings.component.css']
})
export class DriverEarningsComponent implements OnInit {

  langService: LanguageService;

  loading = signal(true);
  data = signal<any>(null);

  // Calendar state
  calYear = signal(new Date().getFullYear());
  calMonth = signal(new Date().getMonth() + 1);
  dailyData = signal<any[]>([]);
  calLoading = signal(false);
  selectedDate = signal<string | null>(null);
  selectedDayRides = signal<any[]>([]);

  // Fuel entry form
  showFuelForm = signal(false);
  fuelForm = signal({
    refuelDate: new Date().toISOString().split('T')[0],
    liters: '',
    pricePerLiter: '',
    odometerKm: '',
    stationName: '',
    notes: '',
    currency: 'FBU'
  });
  fuelSubmitting = signal(false);
  fuelSuccess = signal(false);
  fuelError = signal('');

  constructor(
    private rideService: RideService,
    langService: LanguageService,
    private router: Router
  ) {
    this.langService = langService;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.rideService.getDriverEarningsDetailed().subscribe({
      next: (res: any) => {
        const d = res?.data || res;
        this.data.set(d);
        this.fuelForm.update(f => ({ ...f, currency: d?.currency || 'FBU' }));
        this.loading.set(false);
        this.loadDaily();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadDaily(): void {
    this.calLoading.set(true);
    this.rideService.getDriverEarningsDaily(this.calYear(), this.calMonth()).subscribe({
      next: (res: any) => {
        const d = res?.data || res;
        this.dailyData.set(Array.isArray(d?.days) ? d.days : []);
        this.calLoading.set(false);
      },
      error: () => {
        this.calLoading.set(false);
      }
    });
  }

  get allTime(): any { return this.data()?.allTime || {}; }
  get currentMonth(): any { return this.data()?.currentMonth || {}; }
  get currency(): string { return this.data()?.currency || 'FBU'; }

  // ── Calendar helpers ──────────────────────────────────────────

  get monthLabel(): string {
    const d = new Date(this.calYear(), this.calMonth() - 1, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  get calendarDays(): (number | null)[] {
    const first = new Date(this.calYear(), this.calMonth() - 1, 1);
    const lastDay = new Date(this.calYear(), this.calMonth(), 0).getDate();
    const startPad = (first.getDay() + 6) % 7; // Mon=0
    const days: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay; d++) days.push(d);
    return days;
  }

  prevMonth(): void {
    let m = this.calMonth() - 1;
    let y = this.calYear();
    if (m < 1) { m = 12; y--; }
    this.calMonth.set(m);
    this.calYear.set(y);
    this.selectedDate.set(null);
    this.selectedDayRides.set([]);
    this.loadDaily();
  }

  nextMonth(): void {
    let m = this.calMonth() + 1;
    let y = this.calYear();
    if (m > 12) { m = 1; y++; }
    this.calMonth.set(m);
    this.calYear.set(y);
    this.selectedDate.set(null);
    this.selectedDayRides.set([]);
    this.loadDaily();
  }

  dayKey(day: number): string {
    return `${this.calYear()}-${String(this.calMonth()).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  getDayData(day: number): any {
    const key = this.dayKey(day);
    return this.dailyData().find((d: any) => d.date === key) || null;
  }

  hasActivity(day: number): boolean {
    const d = this.getDayData(day);
    return d && ((d.trips && d.trips > 0) || (d.fuelLiters && this.pf(d.fuelLiters) > 0));
  }

  pf(value: any): number {
    return parseFloat(value) || 0;
  }

  parseInt(val: string): number {
    return parseInt(val, 10);
  }

  selectDay(day: number | null): void {
    if (!day) return;
    const key = this.dayKey(day);
    if (this.selectedDate() === key) {
      this.selectedDate.set(null);
      this.selectedDayRides.set([]);
    } else {
      this.selectedDate.set(key);
      const d = this.getDayData(day);
      this.selectedDayRides.set(d?.rides || []);
    }
  }

  isToday(day: number): boolean {
    const now = new Date();
    return day === now.getDate() && this.calMonth() === now.getMonth() + 1 && this.calYear() === now.getFullYear();
  }

  // ── Fuel form ────────────────────────────────────────────────

  toggleFuelForm(): void {
    this.showFuelForm.update(v => !v);
    this.fuelSuccess.set(false);
    this.fuelError.set('');
  }

  updateFuelField(field: string, value: any): void {
    this.fuelForm.update(f => ({ ...f, [field]: value }));
  }

  submitFuelEntry(): void {
    const f = this.fuelForm();
    if (!f.refuelDate || !f.liters || !f.pricePerLiter) {
      this.fuelError.set('Remplissez au moins la date, les litres et le prix par litre.');
      return;
    }
    this.fuelSubmitting.set(true);
    this.fuelError.set('');
    this.rideService.addFuelEntry({
      refuelDate: f.refuelDate,
      liters: parseFloat(f.liters),
      pricePerLiter: parseFloat(f.pricePerLiter),
      odometerKm: f.odometerKm ? parseFloat(f.odometerKm) : null,
      stationName: f.stationName || null,
      notes: f.notes || null,
      currency: f.currency
    }).subscribe({
      next: () => {
        this.fuelSubmitting.set(false);
        this.fuelSuccess.set(true);
        this.fuelForm.set({
          refuelDate: new Date().toISOString().split('T')[0],
          liters: '', pricePerLiter: '', odometerKm: '',
          stationName: '', notes: '', currency: this.currency
        });
        this.loadData();
      },
      error: () => {
        this.fuelSubmitting.set(false);
        this.fuelError.set("Erreur lors de l'enregistrement.");
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/driver/dashboard']);
  }
}
