# Arpit Labs Mobile Ecosystem Architecture

## Overview
The Arpit Labs mobile ecosystem is built using **Flutter** to provide a high-performance, cross-platform experience (iOS & Android) while maintaining a single codebase.

## Apps
1. **Arpit Labs Community**: Networking, regional chapters, and event management.
2. **Arpit AI**: Personal AI assistant, project generator, and research insights.
3. **Arpit Learning**: Course consumption, certifications, and progress tracking.

## Technical Stack
- **Framework**: Flutter (latest stable)
- **State Management**: BLoC (Business Logic Component) or Riverpod
- **Local Storage**: Hive or Isar (for caching)
- **Authentication**: Supabase Auth (OAuth & Email/Password)
- **Networking**: Dio with interceptors for auth tokens
- **Real-time**: Supabase Realtime for community chat and notifications

## Folder Structure (Clean Architecture)
```text
lib/
├── core/                # Shared utilities, constants, theme, and network client
├── data/                # Data layer: Repositories and Data Sources
│   ├── datasources/     # Remote (Supabase) and Local sources
│   ├── models/          # JSON serialization models
│   └── repositories/    # Implementation of domain repositories
├── domain/              # Business logic (Pure Dart)
│   ├── entities/        # Domain entities
│   ├── repositories/    # Repository interfaces
│   └── usecases/        # Specific business logic actions
├── presentation/        # UI Layer
│   ├── blocs/           # State management (BLoC/Riverpod)
│   ├── pages/           # Screen widgets
│   └── widgets/         # Reusable UI components
└── main.dart            # Entry point
```

## API Integration Strategy
- **Client**: Use `supabase_flutter` package for direct DB access where RLS is sufficient.
- **Middleware**: Use Next.js API routes (Edge Functions) for complex logic and AI processing.
- **Security**: Implement JWT refresh logic and secure storage using `flutter_secure_storage`.

## State Management Approach
- **Global**: Theme, User Auth, and Notifications managed via Riverpod Providers.
- **Local**: Form states and page-specific data managed via BLoC for strict event-to-state mapping.
