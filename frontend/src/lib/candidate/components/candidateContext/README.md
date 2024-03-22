# Candidate Authentication

The files in this folder are responsible for handling candidate authentication. The AuthenticationProvider component provides an authentication context, which the other components need.

## CandidateContextProvider

Candidate context provider provides the candidate context to all its children.

### Contexts

- auth: The authentication context

### Slots

- default: The children of the component

### Usage

```tsx
<CandidateContextProvider>
  <p>Example content</p>
</CandidateContextProvider>
```

## RequireLogin

Require candidates to be logged in to view the children of this component.

### Slots

- default: The content to show when the user is logged in.
- not-logged-in: The content to show when the user is not logged in.

### Properties

- showLogin (optional):
  - If true, the component will render the login page when the user is not logged in.
  - If false, the children of this component will be hidden when the user is not logged in.
  - Default value is false.

### Usage

```tsx
<RequireLogin>
  <p>Example content</p>
</RequireLogin>
```

## LoginPage

Candidate login page. This component also takes care of the login process.

### Usage

```tsx
<LoginPage />
```
