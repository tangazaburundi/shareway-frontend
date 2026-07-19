export interface Partenaire {
  id: string;
  nom: string;
  imageUrl: string;
  lienUrl: string;
  actif: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartenaireCommand {
  nom: string;
  imageUrl: string;
  lienUrl: string;
  actif: boolean;
  sortOrder: number;
}
