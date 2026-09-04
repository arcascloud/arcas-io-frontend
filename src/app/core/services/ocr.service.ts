import { Injectable } from '@angular/core';
import { createWorker, Worker, OEM } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface OcrResult {
  texto: string;
  confianza: number;
}

@Injectable({ providedIn: 'root' })
export class OcrService {
  private worker: Worker | null = null;
  private initializing = false;

  async init(): Promise<void> {
    if (this.worker || this.initializing) return;
    this.initializing = true;
    this.worker = await createWorker('spa', OEM.LSTM_ONLY, {
      logger: () => {},
    });
    this.initializing = false;
  }

  async procesarImagen(imageSource: string | File): Promise<OcrResult> {
    await this.init();
    if (!this.worker) throw new Error('Worker OCR no inicializado');

    const result = await this.worker.recognize(imageSource);
    return {
      texto: result.data.text,
      confianza: result.data.confidence,
    };
  }

  async procesarPdf(file: File): Promise<OcrResult> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoComplejo = '';
    let totalConfianza = 0;
    let paginas = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      const dataUrl = canvas.toDataURL('image/png');
      const result = await this.procesarImagen(dataUrl);
      textoComplejo += result.texto + '\n';
      totalConfianza += result.confianza;
      paginas++;
    }

    return {
      texto: textoComplejo,
      confianza: paginas > 0 ? totalConfianza / paginas : 0,
    };
  }

  async liberar(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
