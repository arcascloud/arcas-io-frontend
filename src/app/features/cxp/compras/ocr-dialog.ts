import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { OcrService } from '../../../core/services/ocr.service';
import { parsearFactura, FacturaData, FacturaItem } from '../../../core/utils/invoice-parser';

@Component({
  selector: 'app-ocr-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, ProgressBarModule, ToastModule, InputTextModule],
  templateUrl: './ocr-dialog.html',
  styleUrl: './ocr-dialog.scss',
})
export class OcrDialog {
  private ocrService = inject(OcrService);
  private msgs = inject(MessageService);

  datosFactura = output<FacturaData>();

  archivo = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  procesando = signal(false);
  progreso = signal(0);
  textoProgreso = signal('');
  resultado = signal<FacturaData | null>(null);
  nroFacturaEdit = '';
  mostrarTexto = signal(false);

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const esImagen = file.type.startsWith('image/');
    const esPdf = file.type === 'application/pdf';

    if (!esImagen && !esPdf) {
      this.msgs.add({ severity: 'warn', summary: 'Formato no soportado', detail: 'Solo se permiten imágenes (JPG, PNG) y PDFs' });
      return;
    }

    this.archivo.set(file);
    this.resultado.set(null);

    if (esImagen) {
      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl.set('pdf');
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
      this.onFileSelect({ target: input } as any);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  limpiar() {
    this.archivo.set(null);
    this.previewUrl.set(null);
    this.resultado.set(null);
    this.nroFacturaEdit = '';
    this.progreso.set(0);
    this.textoProgreso.set('');
  }

  async procesar() {
    const file = this.archivo();
    if (!file) return;

    this.procesando.set(true);
    this.progreso.set(10);
    this.textoProgreso.set('Cargando motor OCR...');

    try {
      this.progreso.set(20);
      this.textoProgreso.set('Procesando documento...');

      let resultado;
      if (file.type === 'application/pdf') {
        resultado = await this.ocrService.procesarPdf(file);
      } else {
        this.progreso.set(40);
        resultado = await this.ocrService.procesarImagen(file);
      }

      this.progreso.set(70);
      this.textoProgreso.set('Analizando texto...');

      const datos = parsearFactura(resultado.texto, resultado.confianza);
      this.resultado.set(datos);
      this.nroFacturaEdit = datos.nroFactura || '';

      this.progreso.set(100);
      this.textoProgreso.set('Completado');

      if (datos.items.length === 0) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Sin items',
          detail: 'No se detectaron productos. Intente con una imagen más clara.',
        });
      } else {
        this.msgs.add({
          severity: 'success',
          summary: 'OCR completado',
          detail: `${datos.items.length} producto(s) detectado(s)`,
        });
      }
    } catch (err: any) {
      this.msgs.add({ severity: 'error', summary: 'Error OCR', detail: err?.message || 'Error al procesar' });
    } finally {
      this.procesando.set(false);
    }
  }

  cargarDatos() {
    const datos = this.resultado();
    if (!datos) return;
    datos.nroFactura = this.nroFacturaEdit;
    this.datosFactura.emit(datos);
  }

  textoCrudoFormateado(): string {
    return this.resultado()?.textoCrudo || '';
  }
}
