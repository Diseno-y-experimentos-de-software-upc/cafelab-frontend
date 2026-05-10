import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import * as L from 'leaflet';
import { MatToolbar } from '@angular/material/toolbar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ToolbarComponent, FormsModule, MatToolbar],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent implements OnInit {
  contactForm = {
    nombre: '',
    correo: '',
    asunto: '',
    mensaje: '',
    archivos: null as FileList | null,
    aceptoTerminos: false
  };

  errores = {
    nombre: '',
    correo: '',
    asunto: '',
    mensaje: ''
  };

  envioExitoso = false;
  showMap = false;
  map: any;

  contactInfo = {
    email: 'contacto@cafelab.com',
    phone: '+51 991 829 980',
    linkedin: 'linkedin.com/in/cafe-metrix-cafelab-04862a368'
  };

  faqs = [
    {
      pregunta: 'CONTACT.FAQ.QUESTION_1',
      respuesta: 'CONTACT.FAQ.ANSWER_1',
      expanded: false
    },
    {
      pregunta: 'CONTACT.FAQ.QUESTION_2',
      respuesta: 'CONTACT.FAQ.ANSWER_2',
      expanded: false
    },
    {
      pregunta: 'CONTACT.FAQ.QUESTION_3',
      respuesta: 'CONTACT.FAQ.ANSWER_3',
      expanded: false
    },
    {
      pregunta: 'CONTACT.FAQ.QUESTION_4',
      respuesta: 'CONTACT.FAQ.ANSWER_4',
      expanded: false
    },
    {
      pregunta: 'CONTACT.FAQ.QUESTION_5',
      respuesta: 'CONTACT.FAQ.ANSWER_5',
      expanded: false
    }
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {}

  onFileSelected(event: any): void {
    this.contactForm.archivos = event.target.files;
  }

  onSubmit(): void {
    if (!this.contactForm.aceptoTerminos) {
      return;
    }
    if (this.validarFormulario()) {
      const contactData = {
        nombre: this.contactForm.nombre,
        correo: this.contactForm.correo,
        asunto: this.contactForm.asunto,
        mensaje: this.contactForm.mensaje,
        archivos: this.contactForm.archivos ? Array.from(this.contactForm.archivos).map(f => f.name) : []
      };

      this.http.post(`${environment.serverBaseUrl}/contact-us`, contactData)
        .subscribe({
          next: () => {
            this.envioExitoso = true;
            this.resetForm();
          },
          error: () => {
            alert('Error al enviar el mensaje');
          }
        });
    }
  }

  validarFormulario(): boolean {
    let valido = true;
    if (!this.contactForm.nombre.trim()) {
      this.errores.nombre = 'El nombre es obligatorio.';
      valido = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(this.contactForm.nombre)) {
      this.errores.nombre = 'El nombre solo debe contener letras y espacios.';
      valido = false;
    } else {
      this.errores.nombre = '';
    }

    if (!this.contactForm.correo.trim()) {
      this.errores.correo = 'El correo es obligatorio.';
      valido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.contactForm.correo)) {
      this.errores.correo = 'El correo no es válido.';
      valido = false;
    } else {
      this.errores.correo = '';
    }

    const asuntoPalabras = this.contactForm.asunto.trim().split(/\s+/);
    if (!this.contactForm.asunto.trim()) {
      this.errores.asunto = 'El asunto es obligatorio.';
      valido = false;
    } else if (asuntoPalabras.length < 5 || asuntoPalabras.length > 10) {
      this.errores.asunto = 'El asunto debe tener entre 5 y 10 palabras.';
      valido = false;
    } else {
      this.errores.asunto = '';
    }

    const mensajePalabras = this.contactForm.mensaje.trim().split(/\s+/);
    if (!this.contactForm.mensaje.trim()) {
      this.errores.mensaje = 'El mensaje es obligatorio.';
      valido = false;
    } else if (mensajePalabras.length < 10 || mensajePalabras.length > 300) {
      this.errores.mensaje = 'El mensaje debe tener entre 10 y 300 palabras.';
      valido = false;
    } else {
      this.errores.mensaje = '';
    }

    return valido;
  }

  cerrarExito(): void {
    this.envioExitoso = false;
  }

  resetForm(): void {
    this.contactForm = {
      nombre: '',
      correo: '',
      asunto: '',
      mensaje: '',
      archivos: null,
      aceptoTerminos: false
    };
    this.errores = {
      nombre: '',
      correo: '',
      asunto: '',
      mensaje: ''
    };
  }

  openEmail(): void {
    window.open('mailto:contacto@cafelab.com', '_blank');
  }

  openWhatsApp(): void {
    window.open('https://wa.me/51991829980', '_blank');
  }

  openLinkedIn(): void {
    window.open('https://linkedin.com/in/cafe-metrix-cafelab-04862a368', '_blank');
  }

  openMap(): void {
    this.showMap = true;

    setTimeout(() => {
      const container = document.getElementById('map');

      if (!container) {
        console.warn('Contenedor #map no está disponible todavía.');
        return;
      }

      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      this.initMap();
    }, 0);
  }

  closeMap(): void {
    this.showMap = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  initMap(): void {
    const container = document.getElementById('map');
    if (container) {
      container.innerHTML = '';
    }

    this.map = L.map('map').setView([-12.120556, -76.992222], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    L.marker([-12.120556, -76.992222]).addTo(this.map)
      .bindPopup('<b>Av. Encalada 365</b><br>Santiago de Surco, Lima, Perú')
      .openPopup();

    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  toggleFaq(index: number): void {
    this.faqs[index].expanded = !this.faqs[index].expanded;
  }
}