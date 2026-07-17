# ShareWay Frontend - Structure Angular

```
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── trip.model.ts
│   │   ├── message.model.ts
│   │   └── review.model.ts
│   └── services/
│       ├── auth.service.ts
│       ├── trip.service.ts
│       ├── message.service.ts
│       ├── review.service.ts
│       └── user.service.ts
├── shared/
│   ├── components/
│   │   ├── navbar/
│   │   └── rating-stars/
│   └── pipes/
│       └── time-ago.pipe.ts
├── features/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── home/
│   ├── trips/
│   │   ├── trip-list/
│   │   ├── trip-detail/
│   │   ├── trip-create/
│   │   └── trip-search/
│   ├── profile/
│   ├── messages/
│   └── reviews/
├── app.routes.ts
├── app.config.ts
└── app.component.ts
```
