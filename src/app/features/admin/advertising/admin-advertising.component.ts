import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdvertisingService } from '../../../core/services/advertising.service';
import { ToastService } from '../../../core/services/toast.service';
import { Advertising, CreateAdvertisingRequest, UpdateAdvertisingRequest } from '../../../core/models/advertising.model';
import { PageResponse } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-advertising',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-advertising.component.html',
  styleUrls: ['./admin-advertising.component.css']
})
export class AdminAdvertisingComponent implements OnInit {
  ads = signal<Advertising[]>([]);
  loading = signal(true);
  totalPages = signal(0);
  currentPage = signal(0);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  stats = signal<Record<string, number> | null>(null);

  form: CreateAdvertisingRequest & UpdateAdvertisingRequest = {
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    position: 'SIDEBAR_MIDDLE',
    displayStart: '',
    displayEnd: '',
    sortOrder: 0,
    targetAudience: 'ALL',
    paymentStatus: 'FREE',
    paymentAmount: 0,
    paymentCurrency: 'FBU'
  };

  positions = ['SIDEBAR_TOP', 'SIDEBAR_MIDDLE', 'SIDEBAR_BOTTOM', 'TOP_BANNER', 'BOTTOM_BANNER', 'POPUP'];
  audiences = ['ALL', 'DRIVER', 'PASSENGER'];
  paymentStatuses = ['FREE', 'PENDING', 'PAID'];
  uploading = signal(false);
  uploadMode = signal<'url' | 'file'>('url');

  private http = inject(HttpClient);

  constructor(private adService: AdvertisingService, private toast: ToastService) {}

  ngOnInit() {
    this.loadAds();
    this.loadStats();
  }

  loadAds(page = 0) {
    this.loading.set(true);
    this.adService.getAll(page).subscribe({
      next: (res: PageResponse<Advertising>) => {
        this.ads.set(res.content);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.number);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadStats() {
    this.adService.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {}
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { title: '', description: '', imageUrl: '', linkUrl: '', position: 'SIDEBAR_MIDDLE',
                  displayStart: '', displayEnd: '', sortOrder: 0, targetAudience: 'ALL',
                  paymentStatus: 'FREE', paymentAmount: 0, paymentCurrency: 'FBU' };
    this.showForm.set(true);
  }

  openEdit(ad: Advertising) {
    this.editingId.set(ad.id);
    this.form = {
      title: ad.title,
      description: ad.description || '',
      imageUrl: ad.imageUrl || '',
      linkUrl: ad.linkUrl || '',
      position: ad.position,
      displayStart: ad.displayStart ? ad.displayStart.substring(0, 19) : '',
      displayEnd: ad.displayEnd ? ad.displayEnd.substring(0, 19) : '',
      sortOrder: ad.sortOrder,
      targetAudience: ad.targetAudience,
      paymentStatus: ad.paymentStatus,
      paymentAmount: ad.paymentAmount || 0,
      paymentCurrency: ad.paymentCurrency || 'FBU'
    };
    this.showForm.set(true);
  }

  save() {
    if (this.editingId()) {
      this.adService.update(this.editingId()!, this.form).subscribe({
        next: () => { this.showForm.set(false); this.loadAds(this.currentPage()); this.toast.success('Publicité mise à jour'); },
        error: (err) => this.toast.error(err.error?.message || 'Mise à jour échouée')
      });
    } else {
      this.adService.create(this.form).subscribe({
        next: () => { this.showForm.set(false); this.loadAds(this.currentPage()); this.loadStats(); this.toast.success('Publicité créée'); },
        error: (err) => this.toast.error(err.error?.message || 'Création échouée')
      });
    }
  }

  deleteAd(id: string) {
    if (!confirm('Supprimer cette publicité ?')) return;
    this.adService.delete(id).subscribe({
      next: () => { this.loadAds(this.currentPage()); this.loadStats(); this.toast.success('Publicité supprimée'); },
      error: () => this.toast.error('Erreur lors de la suppression')
    });
  }

  toggleActive(ad: Advertising) {
    if (ad.active) {
      this.adService.deactivate(ad.id).subscribe({
        next: () => this.loadAds(this.currentPage()),
        error: () => this.toast.error('Erreur lors de la désactivation')
      });
    } else {
      this.adService.activate(ad.id).subscribe({
        next: () => this.loadAds(this.currentPage()),
        error: () => this.toast.error('Erreur lors de l\'activation')
      });
    }
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.toast.warning('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toast.warning('L\'image ne doit pas dépasser 10 Mo');
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.width < 400 || img.height < 140) {
        this.toast.warning('L\'image doit faire au minimum 400 x 140 px (actuellement ' + img.width + ' x ' + img.height + ' px)');
        URL.revokeObjectURL(img.src);
        return;
      }
      URL.revokeObjectURL(img.src);
      this.uploadFile(file);
    };
    img.src = URL.createObjectURL(file);
  }

  private uploadFile(file: File) {
    this.uploading.set(true);
    const fd = new FormData();
    fd.append('file', file);
    this.http.post<{ data: string }>(`${environment.apiUrl}/admin/ads/upload`, fd).subscribe({
      next: (res) => {
        this.form.imageUrl = res.data;
        this.uploading.set(false);
        this.uploadMode.set('url');
      },
      error: () => {
        this.toast.error('Erreur lors de l\'upload de l\'image');
        this.uploading.set(false);
      }
    });
  }

  removeImage() {
    this.form.imageUrl = '';
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.loadAds(page);
    }
  }
}
