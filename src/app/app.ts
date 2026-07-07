import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { User } from './auth/domain/model/user.entity';
import { filter } from 'rxjs/internal/operators/filter';
import { environment } from '../environments/environment';

declare var gtag: Function;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = 'Café Lab';
  currentUser: User | null = null;

  constructor(private translate: TranslateService, private router: Router) {
    this.translate.addLangs(['en', 'es']);
    this.translate.setDefaultLang('es');
    this.translate.use('es');

    // Mantener el atributo lang del <html> sincronizado con el idioma activo (WCAG 3.1.1).
    // Cubre cualquiera de los selectores de idioma, sin importar cuál se use.
    document.documentElement.lang = 'es';
    this.translate.onLangChange.subscribe((event) => {
      document.documentElement.lang = event.lang;
    });

    // 3. Lógica de Google Analytics para Single Page Application
      this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Solo envía datos si no se está en entorno de desarrollo local
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          gtag('config', 'G-V29W6GJWSY', {
            page_path: event.urlAfterRedirects
          });
        } else {
          console.log('GA4: Navegación simulada localmente a ' + event.urlAfterRedirects);
        }
      });

  }

  ngOnInit() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  get showToolbar(): boolean {
    return !!this.currentUser?.hasPlan;
  }
}
