# Route Map

This is an automatically generated map of the SvelteKit application routes.

```
└── routes/
    ├── (voters)/
    │   ├── (located)/
    │   │   ├── questions/
    │   │   │   ├── category/
    │   │   │   │   └── [categoryId]/
    │   │   │   └── [questionId]/
    │   │   └── results/
    │   │       └── [[electionTab]]/
    │   │           ├── statistics/
    │   │           └── [[entityTab=etPl]]/
    │   │               └── [[entity=etSg]]/
    │   │                   └── [[id]]/
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
    │   │   └── logout/
    │   ├── cache/
    │   ├── candidate/
    │   │   ├── auth/
    │   │   │   ├── callback/
    │   │   │   └── logout/
    │   │   └── preregister/
    │   ├── data/
    │   │   └── [collection]/
    │   ├── feedback/
    │   └── oidc/
    │       ├── authorize/
    │       ├── callback/
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
        │   └── status/
        ├── privacy/
        └── register/
            └── password/
```
