# Route Map

This is an automatically generated map of the SvelteKit application routes.

```
└── routes/
    └── [[lang=locale]]/
        ├── (voters)/
        │   ├── (located)/
        │   │   ├── questions/
        │   │   │   ├── category/
        │   │   │   │   └── [categoryId]/
        │   │   │   └── [questionId]/
        │   │   └── results/
        │   │       ├── statistics/
        │   │       └── [entityType]/
        │   │           └── [entityId]/
        │   ├── about/
        │   ├── constituencies/
        │   ├── elections/
        │   ├── info/
        │   ├── intro/
        │   ├── nominations/
        │   └── privacy/
        ├── admin/
        │   ├── (protected)/
        │   │   ├── argument-condensation/
        │   │   ├── jobs/
        │   │   └── question-info/
        │   └── login/
        ├── api/
        │   ├── admin/
        │   │   └── jobs/
        │   │       ├── abort-all/
        │   │       ├── active/
        │   │       ├── past/
        │   │       ├── single/
        │   │       │   └── [jobId]/
        │   │       │       ├── abort/
        │   │       │       └── progress/
        │   │       └── start/
        │   ├── auth/
        │   │   ├── login/
        │   │   └── logout/
        │   ├── cache/
        │   ├── candidate/
        │   │   └── preregister/
        │   ├── data/
        │   │   └── [collection]/
        │   ├── feedback/
        │   └── oidc/
        │       └── token/
        └── candidate/
            ├── (protected)/
            │   ├── preview/
            │   ├── profile/
            │   ├── questions/
            │   │   └── [questionId]/
            │   └── settings/
            ├── forgot-password/
            ├── help/
            ├── login/
            ├── password-reset/
            ├── preregister/
            │   ├── (authenticated)/
            │   │   ├── constituencies/
            │   │   ├── elections/
            │   │   └── email/
            │   ├── signicat/
            │   │   └── oidc/
            │   │       └── callback/
            │   └── status/
            ├── privacy/
            └── register/
                └── password/
```
