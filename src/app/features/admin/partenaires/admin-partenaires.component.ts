import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { ToastService } from '../../../core/services/toast.service';
import { Partenaire, CreatePartenaireCommand } from '../../../core/models/partenaire.model';

@Component({
  selector: 'app-admin-partenaires',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-partenaires.component.html',
  styleUrls: ['./admin-partenaires.component.css']
})
export class AdminPartenairesComponent implements OnInit {
  partenaires = signal<Partenaire[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  submitted = signal(false);
  confirmDeleteId = signal<string | null>(null);

  form: CreatePartenaireCommand = {
    nom: '',
    imageUrl: '',
    lienUrl: '',
    actif: true,
    sortOrder: 0
  };

  constructor(private partenaireService: PartenaireService, private toast: ToastService) {}

  ngOnInit() {
    this.loadPartenaires();
  }

  loadPartenaires() {
    this.loading.set(true);
    this.partenaireService.getAll().subscribe({
      next: (data) => {
        this.partenaires.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { nom: '', imageUrl: '', lienUrl: '', actif: true, sortOrder: 0 };
    this.imagePreview.set(null);
    this.selectedFile.set(null);
    this.submitted.set(false);
    this.showForm.set(true);
  }

  openEdit(p: Partenaire) {
    this.editingId.set(p.id);
    this.form = {
      nom: p.nom,
      imageUrl: p.imageUrl,
      lienUrl: p.lienUrl,
      actif: p.actif,
      sortOrder: p.sortOrder
    };
    this.imagePreview.set(p.imageUrl || null);
    this.selectedFile.set(null);
    this.submitted.set(false);
    this.showForm.set(true);
  }

  hasError(field: string): boolean {
    if (!this.submitted()) return false;
    switch (field) {
      case 'nom': return !this.form.nom?.trim();
      default: return false;
    }
  }

  save() {
    this.submitted.set(true);
    if (!this.form.nom?.trim()) return;

    if (this.editingId()) {
      this.partenaireService.update(this.editingId()!, this.form).subscribe({
        next: (saved) => {
          if (this.selectedFile()) {
            this.uploadAfterSave(saved.id);
          } else {
            this.showForm.set(false);
            this.loadPartenaires();
            this.toast.success('Partenaire mis à jour');
          }
        },
        error: (err) => this.toast.error(err.error?.message || 'Mise à jour échouée')
      });
    } else {
      this.partenaireService.create(this.form).subscribe({
        next: (saved) => {
          if (this.selectedFile()) {
            this.uploadAfterSave(saved.id);
          } else {
            this.showForm.set(false);
            this.loadPartenaires();
            this.toast.success('Partenaire créé');
          }
        },
        error: (err) => this.toast.error(err.error?.message || 'Création échouée')
      });
    }
  }

  private uploadAfterSave(id: string) {
    if (!this.selectedFile()) return;
    this.partenaireService.uploadImage(id, this.selectedFile()!).subscribe({
      next: () => { this.showForm.set(false); this.loadPartenaires(); },
      error: () => { this.showForm.set(false); this.loadPartenaires(); }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.selectedFile.set(file);
    this.form.imageUrl = '';
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onImageUrlChange() {
    if (this.form.imageUrl) {
      this.selectedFile.set(null);
      this.imagePreview.set(this.form.imageUrl);
    }
  }

  removeImage() {
    this.selectedFile.set(null);
    this.form.imageUrl = '';
    this.imagePreview.set(null);
  }

  deletePartenaire(id: string) {
    this.confirmDeleteId.set(id);
  }

  confirmDelete() {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.confirmDeleteId.set(null);
    this.partenaireService.delete(id).subscribe({
      next: () => { this.loadPartenaires(); this.toast.success('Partenaire supprimé'); },
      error: () => this.toast.error('Erreur lors de la suppression')
    });
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  toggleActive(p: Partenaire) {
    this.partenaireService.toggleActive(p.id).subscribe({
      next: () => this.loadPartenaires(),
      error: () => this.toast.error('Erreur lors du changement de statut')
    });
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.imagePreview.set(null);
    this.selectedFile.set(null);
  }
}
