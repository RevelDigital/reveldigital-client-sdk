# Revel Digital Client SDK

A TypeScript/JavaScript library for interfacing web applications with the Revel Digital player. This SDK provides a unified API for communication between your web content and the Revel Digital digital signage platform.

## Features

- 🎯 **Event Handling**: Listen for player events (start, stop, commands)
- 🔄 **Two-way Communication**: Send commands and callbacks to the player
- 🌍 **Device Information**: Access device timezone, language, and location data
- 📊 **Analytics**: Track custom events with AdHawk analytics
- 🎛️ **Preferences**: Access user preferences via the Gadgets API
- ⚛️ **Framework Support**: Works with React, Angular, Vue, and vanilla JavaScript

## Installation

```bash
npm install @reveldigital/client-sdk
```

## Quick Start

```javascript
import { createPlayerClient, EventType } from "@reveldigital/client-sdk";

const client = createPlayerClient();

// Listen for player events
client.on(EventType.START, () => {
  console.log('Player started');
});

// Get device information
const deviceTime = await client.getDeviceTime();
const deviceKey = await client.getDeviceKey();

// Send a callback to the player
client.callback('hello', 'world');
```

## Table of Contents

- [Framework Integration](#framework-integration)
  - [React Integration](#react-integration)
  - [Angular Integration](#angular-integration)
  - [Vue 3 Integration](#vue-3-integration)
- [API Reference](#api-reference)
  - [Core Methods](#core-methods)
  - [Event Types](#event-types)
- [Best Practices](#best-practices)
  - [Error Handling](#error-handling)
  - [Performance Considerations](#performance-considerations)
  - [Security Notes](#security-notes)
- [Deployment with GitHub Actions](#deployment-with-github-actions)
  - [Setting up the GitHub Action](#setting-up-the-github-action)
  - [Action Inputs](#action-inputs)
  - [Environment Management](#environment-management)
  - [Advanced Configuration](#advanced-configuration)
  - [Best Practices](#best-practices-1)
  - [Troubleshooting](#troubleshooting)
- [TypeScript Support](#typescript-support)
- [Development](#development)
- [Resources](#resources)

## Framework Integration

### React Integration

#### Basic Setup

```tsx
// hooks/usePlayerClient.ts
import { useEffect, useState, useCallback } from 'react';
import { createPlayerClient, EventType, PlayerClient } from '@reveldigital/client-sdk';

export const usePlayerClient = () => {
  const [client] = useState<PlayerClient>(() => createPlayerClient());
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    key?: string;
    timezone?: string;
    language?: string;
  }>({});

  useEffect(() => {
    // Set up event listeners
    client.on(EventType.START, () => {
      setIsPlayerActive(true);
    });

    client.on(EventType.STOP, () => {
      setIsPlayerActive(false);
    });

    client.on(EventType.COMMAND, (data) => {
      console.log('Received command:', data);
    });

    // Load device information
    const loadDeviceInfo = async () => {
      try {
        const [key, timezone, language] = await Promise.all([
          client.getDeviceKey(),
          client.getDeviceTimeZoneName(),
          client.getLanguageCode()
        ]);

        setDeviceInfo({
          key: key || undefined,
          timezone: timezone || undefined,
          language: language || undefined
        });
      } catch (error) {
        console.error('Failed to load device info:', error);
      }
    };

    loadDeviceInfo();

    // Cleanup on unmount
    return () => {
      client.off(EventType.START);
      client.off(EventType.STOP);
      client.off(EventType.COMMAND);
    };
  }, [client]);

  const sendCallback = useCallback((...args: any[]) => {
    client.callback(...args);
  }, [client]);

  const trackEvent = useCallback((eventName: string, properties?: any) => {
    client.track(eventName, properties);
  }, [client]);

  return {
    client,
    isPlayerActive,
    deviceInfo,
    sendCallback,
    trackEvent
  };
};
```

#### Component Example

```tsx
// components/PlayerAwareComponent.tsx
import React, { useEffect } from 'react';
import { usePlayerClient } from '../hooks/usePlayerClient';

export const PlayerAwareComponent: React.FC = () => {
  const { isPlayerActive, deviceInfo, sendCallback, trackEvent } = usePlayerClient();

  useEffect(() => {
    // Track component mount
    trackEvent('component_mounted', { component: 'PlayerAwareComponent' });
  }, [trackEvent]);

  const handleButtonClick = () => {
    sendCallback('button_clicked', new Date().toISOString());
    trackEvent('user_interaction', { action: 'button_click' });
  };

  return (
    <div className="player-component">
      <h2>Player Status: {isPlayerActive ? 'Active' : 'Inactive'}</h2>
      
      <div className="device-info">
        <h3>Device Information</h3>
        <p>Device Key: {deviceInfo.key || 'Unknown'}</p>
        <p>Timezone: {deviceInfo.timezone || 'Unknown'}</p>
        <p>Language: {deviceInfo.language || 'Unknown'}</p>
      </div>

      <button onClick={handleButtonClick}>
        Send Callback to Player
      </button>
    </div>
  );
};
```

#### Context Provider Pattern

```tsx
// context/PlayerContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { PlayerClient } from '@reveldigital/client-sdk';
import { usePlayerClient } from '../hooks/usePlayerClient';

interface PlayerContextType {
  client: PlayerClient;
  isPlayerActive: boolean;
  deviceInfo: any;
  sendCallback: (...args: any[]) => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const playerData = usePlayerClient();

  return (
    <PlayerContext.Provider value={playerData}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
```

### Angular Integration

#### Service Setup

```typescript
// services/player.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createPlayerClient, EventType, PlayerClient } from '@reveldigital/client-sdk';

interface DeviceInfo {
  key?: string;
  timezone?: string;
  language?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService implements OnDestroy {
  private client: PlayerClient;
  private isPlayerActiveSubject = new BehaviorSubject<boolean>(false);
  private deviceInfoSubject = new BehaviorSubject<DeviceInfo>({});

  public isPlayerActive$: Observable<boolean> = this.isPlayerActiveSubject.asObservable();
  public deviceInfo$: Observable<DeviceInfo> = this.deviceInfoSubject.asObservable();

  constructor() {
    this.client = createPlayerClient();
    this.setupEventListeners();
    this.loadDeviceInfo();
  }

  private setupEventListeners(): void {
    this.client.on(EventType.START, () => {
      this.isPlayerActiveSubject.next(true);
    });

    this.client.on(EventType.STOP, () => {
      this.isPlayerActiveSubject.next(false);
    });

    this.client.on(EventType.COMMAND, (data) => {
      console.log('Received command:', data);
    });
  }

  private async loadDeviceInfo(): Promise<void> {
    try {
      const [key, timezone, language] = await Promise.all([
        this.client.getDeviceKey(),
        this.client.getDeviceTimeZoneName(),
        this.client.getLanguageCode()
      ]);

      this.deviceInfoSubject.next({
        key: key || undefined,
        timezone: timezone || undefined,
        language: language || undefined
      });
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  }

  public sendCallback(...args: any[]): void {
    this.client.callback(...args);
  }

  public trackEvent(eventName: string, properties?: any): void {
    this.client.track(eventName, properties);
  }

  public async getDeviceTime(date?: Date): Promise<string | null> {
    return this.client.getDeviceTime(date);
  }

  public sendCommand(name: string, arg: string): void {
    this.client.sendCommand(name, arg);
  }

  ngOnDestroy(): void {
    this.client.off(EventType.START);
    this.client.off(EventType.STOP);
    this.client.off(EventType.COMMAND);
  }
}
```

#### Component Example

```typescript
// components/player-aware.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-player-aware',
  template: `
    <div class="player-component">
      <h2>Player Status: {{ isPlayerActive ? 'Active' : 'Inactive' }}</h2>
      
      <div class="device-info">
        <h3>Device Information</h3>
        <p>Device Key: {{ deviceInfo?.key || 'Unknown' }}</p>
        <p>Timezone: {{ deviceInfo?.timezone || 'Unknown' }}</p>
        <p>Language: {{ deviceInfo?.language || 'Unknown' }}</p>
      </div>

      <button (click)="handleButtonClick()">
        Send Callback to Player
      </button>
    </div>
  `
})
export class PlayerAwareComponent implements OnInit, OnDestroy {
  public isPlayerActive = false;
  public deviceInfo: any = {};
  private subscriptions = new Subscription();

  constructor(private playerService: PlayerService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.playerService.isPlayerActive$.subscribe(
        active => this.isPlayerActive = active
      )
    );

    this.subscriptions.add(
      this.playerService.deviceInfo$.subscribe(
        info => this.deviceInfo = info
      )
    );

    this.playerService.trackEvent('component_mounted', { 
      component: 'PlayerAwareComponent' 
    });
  }

  handleButtonClick(): void {
    this.playerService.sendCallback('button_clicked', new Date().toISOString());
    this.playerService.trackEvent('user_interaction', { action: 'button_click' });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
```

### Vue 3 Integration

#### Composable Setup

```typescript
// composables/usePlayerClient.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { createPlayerClient, EventType, PlayerClient } from '@reveldigital/client-sdk';

export const usePlayerClient = () => {
  const client: PlayerClient = createPlayerClient();
  const isPlayerActive = ref(false);
  const deviceInfo = ref({
    key: undefined as string | undefined,
    timezone: undefined as string | undefined,
    language: undefined as string | undefined,
  });

  const setupEventListeners = () => {
    client.on(EventType.START, () => {
      isPlayerActive.value = true;
    });

    client.on(EventType.STOP, () => {
      isPlayerActive.value = false;
    });

    client.on(EventType.COMMAND, (data) => {
      console.log('Received command:', data);
    });
  };

  const loadDeviceInfo = async () => {
    try {
      const [key, timezone, language] = await Promise.all([
        client.getDeviceKey(),
        client.getDeviceTimeZoneName(),
        client.getLanguageCode()
      ]);

      deviceInfo.value = {
        key: key || undefined,
        timezone: timezone || undefined,
        language: language || undefined
      };
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  };

  const sendCallback = (...args: any[]) => {
    client.callback(...args);
  };

  const trackEvent = (eventName: string, properties?: any) => {
    client.track(eventName, properties);
  };

  onMounted(() => {
    setupEventListeners();
    loadDeviceInfo();
  });

  onUnmounted(() => {
    client.off(EventType.START);
    client.off(EventType.STOP);
    client.off(EventType.COMMAND);
  });

  return {
    client,
    isPlayerActive,
    deviceInfo,
    sendCallback,
    trackEvent
  };
};
```

#### Component Example

```vue
<!-- components/PlayerAwareComponent.vue -->
<template>
  <div class="player-component">
    <h2>Player Status: {{ isPlayerActive ? 'Active' : 'Inactive' }}</h2>
    
    <div class="device-info">
      <h3>Device Information</h3>
      <p>Device Key: {{ deviceInfo.key || 'Unknown' }}</p>
      <p>Timezone: {{ deviceInfo.timezone || 'Unknown' }}</p>
      <p>Language: {{ deviceInfo.language || 'Unknown' }}</p>
    </div>

    <button @click="handleButtonClick">
      Send Callback to Player
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePlayerClient } from '../composables/usePlayerClient';

const { isPlayerActive, deviceInfo, sendCallback, trackEvent } = usePlayerClient();

onMounted(() => {
  trackEvent('component_mounted', { component: 'PlayerAwareComponent' });
});

const handleButtonClick = () => {
  sendCallback('button_clicked', new Date().toISOString());
  trackEvent('user_interaction', { action: 'button_click' });
};
</script>
```

#### Plugin Setup (Optional)

```typescript
// plugins/playerClient.ts
import { App } from 'vue';
import { createPlayerClient } from '@reveldigital/client-sdk';

export default {
  install(app: App) {
    const client = createPlayerClient();
    
    app.config.globalProperties.$playerClient = client;
    app.provide('playerClient', client);
  }
};
```

## API Reference

[API Documentation](https://reveldigital.github.io/reveldigital-client-sdk/)

### Core Methods

#### `createPlayerClient(options?: IOptions): PlayerClient`
Creates a new player client instance.

#### Event Management
- `on(eventType: EventType, callback: Function)` - Listen for events
- `off(eventType: EventType)` - Remove event listener

#### Device Information
- `getDeviceKey(): Promise<string | null>` - Get unique device identifier
- `getDeviceTime(date?: Date): Promise<string | null>` - Get device time in ISO8601
- `getDeviceTimeZoneName(): Promise<string | null>` - Get timezone name
- `getDeviceTimeZoneID(): Promise<string | null>` - Get timezone ID
- `getDeviceTimeZoneOffset(): Promise<number | null>` - Get timezone offset
- `getLanguageCode(): Promise<string | null>` - Get device language

#### Communication
- `callback(...args: any[]): void` - Send callback to player
- `sendCommand(name: string, arg: string): void` - Send command to player
- `sendRemoteCommand(deviceKeys: string[], name: string, arg: string): void` - Send command to remote devices

#### Analytics & Preferences
- `track(eventName: string, properties?: IEventProperties): void` - Track analytics event
- `getPrefs(): gadgets.Prefs | undefined` - Access user preferences

### Event Types

```typescript
enum EventType {
  START = 'Start',    // Player started
  STOP = 'Stop',      // Player stopped
  COMMAND = 'Command' // Command received
}
```

## Best Practices

### Error Handling

```javascript
import { createPlayerClient } from "@reveldigital/client-sdk";

const client = createPlayerClient();

try {
  const deviceKey = await client.getDeviceKey();
  if (deviceKey) {
    // Handle success
    console.log('Device key:', deviceKey);
  } else {
    // Handle null response
    console.warn('Device key not available');
  }
} catch (error) {
  // Handle errors
  console.error('Failed to get device key:', error);
}
```

### Performance Considerations

- Create the client instance once and reuse it
- Clean up event listeners when components unmount
- Use debouncing for frequent callback calls
- Cache device information when possible

### Security Notes

- Device information should be treated as sensitive
- Validate all data received from player events
- Use HTTPS for any external API calls from your content

## Deployment with GitHub Actions

The Revel Digital Webapp Deploy Action makes it easy to automatically deploy your web applications to your Revel Digital account whenever you push code to your repository.

### Setting up the GitHub Action

1. **Get your API Key**: First, obtain your Revel Digital API key from your account settings.

2. **Add API Key to GitHub Secrets**: 
   - Go to your repository settings
   - Navigate to "Secrets and variables" → "Actions" 
   - Create a new secret named `REVEL_API_KEY` with your API key as the value

3. **Create the workflow file**: Add `.github/workflows/deploy.yml` to your repository:

#### Basic Deployment Workflow

```yaml
name: Deploy to Revel Digital

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build application
        run: npm run build

      - name: Deploy to Revel Digital
        uses: RevelDigital/webapp-action@v1.0.11
        with:
          api-key: ${{ secrets.REVEL_API_KEY }}
          environment: ${{ github.ref_name }}
```

#### Framework-Specific Examples

##### React Application

```yaml
name: Deploy React App

on:
  push:
    branches: [ main, develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build React app
        run: npm run build

      - name: Deploy to Revel Digital
        uses: RevelDigital/webapp-action@v1.0.11
        with:
          api-key: ${{ secrets.REVEL_API_KEY }}
          name: "My React Signage App"
          version: ${{ github.sha }}
          environment: ${{ github.ref_name == 'main' && 'Production' || 'Development' }}
          distribution-location: './build'
          tags: 'react,interactive'
```

##### Angular Application

```yaml
name: Deploy Angular App

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Angular CLI
        run: npm install -g @angular/cli

      - name: Install dependencies
        run: npm install

      - name: Build Angular app
        run: ng build --configuration production

      - name: Deploy to Revel Digital
        uses: RevelDigital/webapp-action@v1.0.11
        with:
          api-key: ${{ secrets.REVEL_API_KEY }}
          name: "My Angular Signage App"
          environment: "Production"
          distribution-location: './dist'
          tags: 'angular,enterprise'
```

##### Vue Application

```yaml
name: Deploy Vue App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build Vue app
        run: npm run build

      - name: Deploy to Revel Digital
        uses: RevelDigital/webapp-action@v1.0.11
        with:
          api-key: ${{ secrets.REVEL_API_KEY }}
          name: "My Vue Signage App"
          environment: ${{ github.event_name == 'push' && 'Production' || 'Development' }}
          distribution-location: './dist'
          group-name: 'signage-.*'
```

### Action Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| `api-key` | ✅ | Your Revel Digital API key (use GitHub secrets) | - |
| `name` | ❌ | Name for the webapp | From package.json |
| `version` | ❌ | Version of the webapp | From package.json |
| `environment` | ❌ | Deployment environment | `Production` |
| `distribution-location` | ❌ | Folder containing built assets | From package.json |
| `tags` | ❌ | Extra tags for smart scheduling (comma-delimited) | - |
| `group-name` | ❌ | Group name as regex pattern | - |

### Environment Management

You can deploy to different environments based on your branch strategy:

```yaml
# Deploy to Development for feature branches
# Deploy to Production for main branch
environment: ${{ github.ref_name == 'main' && 'Production' || 'Development' }}

# Or use custom logic
environment: ${{ 
  github.ref_name == 'main' && 'Production' || 
  github.ref_name == 'staging' && 'Staging' || 
  'Development' 
}}
```

### Advanced Configuration

#### Multi-Environment with Matrix Strategy

```yaml
name: Deploy to Multiple Environments

on:
  push:
    branches: [ main, staging, develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - branch: main
            environment: Production
            tags: 'production,stable'
          - branch: staging
            environment: Staging
            tags: 'staging,testing'
          - branch: develop
            environment: Development
            tags: 'development,experimental'
    
    if: github.ref_name == matrix.branch
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup and Build
        # ... build steps ...

      - name: Deploy to Revel Digital
        uses: RevelDigital/webapp-action@v1.0.11
        with:
          api-key: ${{ secrets.REVEL_API_KEY }}
          environment: ${{ matrix.environment }}
          tags: ${{ matrix.tags }}
```

#### Conditional Deployment

```yaml
name: Conditional Deploy

on:
  push:
    branches: [ main ]
    paths: 
      - 'src/**'
      - 'public/**'
      - 'package.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[deploy]') || github.ref == 'refs/heads/main'
    
    steps:
      # ... deployment steps
```

### Best Practices

1. **Use Semantic Versioning**: Let the action pull version from `package.json` or use Git tags
2. **Environment Separation**: Use different environments for different branches
3. **Tag Management**: Use meaningful tags for content organization and smart scheduling
4. **Build Optimization**: Ensure your build process creates optimized, production-ready assets
5. **Security**: Always use GitHub Secrets for API keys, never commit them to your repository

### Troubleshooting

- **Build Failures**: Ensure your build command works locally before deploying
- **Permission Issues**: Verify your API key has the necessary permissions in Revel Digital
- **Path Issues**: Check that `distribution-location` points to the correct build output folder
- **Environment Issues**: Confirm the environment name exists in your Revel Digital account

## TypeScript Support

This library is written in TypeScript and includes full type definitions. Import types as needed:

```typescript
import { 
  PlayerClient, 
  EventType, 
  IEventProperties, 
  IOptions 
} from '@reveldigital/client-sdk';
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build

# Generate documentation
npm run gen:docs
```

## Resources

- [**API Documentation**](https://reveldigital.github.io/reveldigital-client-sdk/)
- [Revel Digital Platform](https://www.reveldigital.com)
- [Revel Digital Webapps](https://developer.reveldigital.com/webapps/)
- [Revel Digital Webapp Github Action](https://github.com/marketplace/actions/revel-digital-webapp-deploy-action)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

**Copyright (c) 2025 Revel Digital**

For the full license text, please refer to the [LICENSE](LICENSE) file in this repository.

