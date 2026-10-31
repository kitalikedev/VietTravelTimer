import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/VietTravelTimer/', // Chuẩn tuyệt đối cho GitHub Pages kitalikedev.github.io/VietTravelTimer/
});