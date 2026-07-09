# ShareWay Front — Angular 18

Application Angular de covoiturage, standalone components, signals.

## Stack
- **Angular 18** (standalone, signals)
- **RxJS** pour les appels HTTP
- **Angular Forms** (ReactiveFormsModule)
- Pas de dépendance UI tierce (CSS custom)

## Lancer le projet

```bash
npm install
npm start
# → http://localhost:4200
```

Le proxy redirige `/api` vers `http://localhost:8080` (ton back Spring Boot).

## Structure

```
src/app/
├── core/
│   ├── guards/         → auth.guard.ts (authGuard, guestGuard)
│   ├── interceptors/   → auth.interceptor.ts (JWT Bearer)
│   ├── models/         → interfaces TypeScript
│   └── services/       → AuthService, TripService, MessageService, ReviewService, UserService
├── shared/
│   ├── components/
│   │   ├── navbar/           → barre de navigation
│   │   └── rating-stars/     → composant étoiles réutilisable
│   └── pipes/
│       └── time-ago.pipe.ts  → "il y a 5 min"
└── features/
    ├── home/           → page d'accueil + recherche
    ├── auth/
    │   ├── login/      → formulaire connexion
    │   └── register/   → formulaire inscription
    ├── trips/
    │   ├── trip-search/  → liste + filtres
    │   ├── trip-detail/  → détail + réservation
    │   └── trip-create/  → formulaire création trajet
    ├── messages/       → messagerie (conversations + chat)
    └── profile/        → profil public/privé + avis + trajets
```

## Routes

| URL | Page | Auth |
|-----|------|------|
| `/` | Accueil | - |
| `/auth/login` | Connexion | Guest only |
| `/auth/register` | Inscription | Guest only |
| `/trips` | Recherche de trajets | - |
| `/trips/new` | Créer un trajet | ✅ |
| `/trips/:id` | Détail d'un trajet | - |
| `/messages` | Messagerie | ✅ |
| `/messages/:userId` | Conversation | ✅ |
| `/profile` | Mon profil | ✅ |
| `/profile/:id` | Profil utilisateur | - |

## Variables d'environnement

Modifier `src/environments/environment.ts` :
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // ← ton back
};
```
