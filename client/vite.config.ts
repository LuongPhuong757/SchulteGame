import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// LAN exposure is opt-in through the dev:phone script only.
export default defineConfig({
  plugins: [react()],
});
