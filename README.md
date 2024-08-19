# SDK Library

Library for interfacing web apps with the Revel Digital player.

## Installation and prerequisites

```
npm install @reveldigital/client-sdk
```

## Usage

```javascript
import { createPlayerClient } from "@reveldigital/client-sdk";

const api = createPlayerClient();

// Trigger a callback on the player
await api.callback('hello world');
```

 [**API Documentation**](https://reveldigital.github.io/reveldigital-client-sdk/)