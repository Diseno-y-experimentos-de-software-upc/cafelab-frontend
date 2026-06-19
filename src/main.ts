import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// 1. Declaramos la interfaz para que TypeScript reconozca dataLayer en el objeto window
declare global {
  interface Window {
    dataLayer: any[];
  }
}

// Inicialización de Google Analytics
const measurementId = "G-V29W6GJWSY";

if (measurementId) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

window.dataLayer = window.dataLayer || [];
function gtag(...args: any[]) {
  window.dataLayer.push(args);
}
if (measurementId) {
  gtag('js', new Date());
  gtag('config', measurementId);
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
