import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink,ParamMap } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { ReviewService } from '../../core/services/review.service';
import { TripService } from '../../core/services/trip.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { User } from '../../core/models/user.model';
import { Review } from '../../core/models/review.model';
import { Trip } from '../../core/models/trip.model';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';


@Component({ selector: 'app-profile', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RatingStarsComponent, TimeAgoPipe,FormsModule],
  templateUrl: './profile.component.html', styleUrls: ['./profile.component.css'] })
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private reviewService = inject(ReviewService);
  private tripService = inject(TripService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  langService = inject(LanguageService);

  user: User | null = null;
  reviews: Review[] = []; userTrips: Trip[] = [];
  loading = true; tab = 'trips'; activeSection = '';
  savingProfile = false; savingVehicle = false; saveSuccess = false; vehicleSaved = false; identityUploaded = false;
  prefKeys = ['music', 'smoking', 'pets', 'talking', 'ac','smallLuggage','largeLuggage'];

  isReportModalOpen = false;
  reportReason = '';
  selectedReviewId: string | null = null;

  cookieCategories = [
    { key: 'necessary',  label: 'Nécessaires',     description: 'Fonctionnement du site',        checked: true,  required: true },
    { key: 'analytics',  label: 'Analytiques',      description: 'Audience et statistiques',      checked: true,  required: false },
    { key: 'marketing',  label: 'Marketing',        description: 'Publicité ciblée',              checked: true,  required: false },
    { key: 'functional', label: 'Fonctionnelles',   description: 'Préférences utilisateur',       checked: true,  required: false },
  ];
  cookieSaved = false;

  editForm = this.fb.group({
    firstName: ['', Validators.required], lastName: ['', Validators.required],
    bio: [''], phone: [''], phoneVisible: [false], preferredLang: ['fr'],
    pref_music: [false], pref_smoking: [false], pref_pets: [false], pref_talking: [true], pref_ac: [false],
  });

  vehicleForm = this.fb.group({
    brand: ['', Validators.required], model: ['', Validators.required],
    color: [''], year: [null], licensePlate: ['', Validators.required],
  });

  get isOwnProfile() {
    const pid = this.route.snapshot.paramMap.get('id');
    return !pid || pid === this.authService.currentUser()?.id;
  }

  ngOnInit() {
  /*
    const pid = this.route.snapshot.paramMap.get('id');
    const uid = pid || this.authService.currentUser()?.id!;

    this.userService.getProfile(uid).subscribe({
      next: (res) => {
        this.user = res.data!; this.loading = false;
        this.editForm.patchValue({
          firstName: this.user.firstName, lastName: this.user.lastName,
          bio: this.user.bio || '', phone: this.user.phone || '',
          phoneVisible: this.user.phoneVisible || false,
          preferredLang: this.user.preferredLang || 'fr',
          pref_music: this.user.preferences?.music ?? false,
          pref_smoking: this.user.preferences?.smoking ?? false,
          pref_pets: this.user.preferences?.pets ?? false,
          pref_talking: this.user.preferences?.talking ?? true,
          pref_ac: false,
        });
        if (this.user.vehicle) this.vehicleForm.patchValue(this.user.vehicle as any);
      },
      error: () => { this.loading = false; }
    });
    this.reviewService.getUserReviews(uid).subscribe({
        next: (res: any) => {
            this.reviews = res.data?.content || [];
           } });
    if(!pid){
      this.tripService.getMyTrips().subscribe({ next: (res) => { this.userTrips = res.data || []; } });
    }
    */

    this.route.paramMap.subscribe(params => {

      this.user = null;
      this.reviews = [];
      this.userTrips = [];
      this.loading = true;

     /*  const pid = params.get('id');
      const uid = pid || this.authService.currentUser()?.id!; */

      this.loadProfile(params);

    });
  }

  saveProfile() {
    if (this.editForm.invalid) return;
    this.savingProfile = true;
    const v = this.editForm.value;
    const payload = {
      firstName: v.firstName, lastName: v.lastName, bio: v.bio, phone: v.phone, phoneVisible: v.phoneVisible, preferredLang: v.preferredLang,
      preferences: { music: v.pref_music, smoking: v.pref_smoking, pets: v.pref_pets, talking: v.pref_talking }
    };
    this.userService.updateProfile(payload as any).subscribe({
      next: (res) => {
        this.user = res.data!; this.authService.updateCurrentUser(res.data!);
        this.langService.setLang(v.preferredLang as any);
        this.saveSuccess = true; this.savingProfile = false;
        setTimeout(() => { this.saveSuccess = false; this.activeSection = ''; }, 2000);
      },
      error: () => { this.savingProfile = false; }
    });
  }

  saveVehicle() {
    if (this.vehicleForm.invalid) return;
    this.savingVehicle = true;
    this.userService.saveVehicle(this.vehicleForm.value as any).subscribe({
      next: (res) => {
        if (this.user) this.user.vehicle = res.data!;
        this.vehicleSaved = true; this.savingVehicle = false;
        setTimeout(() => { this.vehicleSaved = false; this.activeSection = ''; }, 2000);
      },
      error: () => { this.savingVehicle = false; }
    });
  }

  uploadAvatar(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.userService.uploadAvatar(file).subscribe({
      next: (res) => { if (this.user) { this.user.avatarUrl = res.data!.avatarUrl; this.authService.updateCurrentUser({ ...this.user }); } }
    });
  }

  uploadIdentity(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.userService.uploadIdentity(file).subscribe({ next: () => { this.identityUploaded = true; } });
  }

  switchRole() {
    const roles = ['DRIVER', 'PASSENGER', 'BOTH'];
    const next = roles[(roles.indexOf(this.user?.role || 'PASSENGER') + 1) % roles.length] as any;
    this.userService.switchRole(next).subscribe({
      next: (res) => { this.user = res.data!; this.authService.updateCurrentUser(res.data!); }
    });
  }

  loadCookiePrefs() {
    const stored = localStorage.getItem('sw_cookie_consent');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.prefs) {
          this.cookieCategories.forEach(c => {
            if (data.prefs[c.key] !== undefined) c.checked = data.prefs[c.key];
          });
        }
      } catch {}
    }
  }

  toggleCookie(key: string, checked: boolean) {
    const cat = this.cookieCategories.find(c => c.key === key);
    if (cat && !cat.required) cat.checked = checked;
  }

  saveCookiePrefs() {
    const prefs: Record<string, boolean> = {};
    this.cookieCategories.forEach(c => prefs[c.key] = c.checked);
    const mode = this.cookieCategories.every(c => c.checked) ? 'all'
      : this.cookieCategories.filter(c => !c.required).every(c => !c.checked) ? 'rejected'
      : 'selection';
    localStorage.setItem('sw_cookie_consent', JSON.stringify({ mode, prefs }));
    this.cookieSaved = true;
    setTimeout(() => { this.cookieSaved = false; this.activeSection = ''; }, 2000);
  }

  reopenCookieBanner() {
    localStorage.removeItem('sw_cookie_consent');
    this.cookieCategories.forEach(c => c.checked = !c.required);
    this.activeSection = 'cookies';
  }


   openReportModal(reviewId: string) {
      this.selectedReviewId = reviewId;
      this.reportReason = '';
      this.isReportModalOpen = true;
    }

    closeReportModal() {
      this.isReportModalOpen = false;
      this.selectedReviewId = null;
      this.reportReason = '';
    }

    submitReport() {
      if (!this.selectedReviewId || !this.reportReason.trim()) return;

      this.reviewService.flagReview(
        this.selectedReviewId,
        this.reportReason
      ).subscribe({
        next: () => {
          alert('Avis signalé avec succès');
          this.closeReportModal();
        },
        error: (err) => {
          console.error(err);
          alert('Erreur lors du signalement');
        }
      });
    }




    /////////////////////////////////

    private loadProfile(params: ParamMap) {

      const pid = params.get('id');
      const uid = pid || this.authService.currentUser()?.id!;
      this.loading = true;

      this.userService.getProfile(uid).subscribe({
        next: (res) => {
          this.user = res.data!;
          this.loading = false;

          this.editForm.patchValue({
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            bio: this.user.bio || '',
            phone: this.user.phone || '',
            phoneVisible: this.user.phoneVisible || false,
            preferredLang: this.user.preferredLang || 'fr',
            pref_music: this.user.preferences?.music ?? false,
            pref_smoking: this.user.preferences?.smoking ?? false,
            pref_pets: this.user.preferences?.pets ?? false,
            pref_talking: this.user.preferences?.talking ?? true,
            pref_ac: false
          });

          if (this.user.vehicle) {
            this.vehicleForm.patchValue(this.user.vehicle as any);
          }
        },
        error: () => {
          this.loading = false;
        }
      });

      this.reviewService.getUserReviews(uid).subscribe({
        next: (res: any) => {
          this.reviews = res.data?.content || [];
        }
      });

       if(!pid){
        this.tripService.getMyTrips().subscribe({ next: (res) => { this.userTrips = res.data || []; } });
      }
    }
}