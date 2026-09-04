import { Component } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'footer',
    standalone: true,
    imports: [ButtonModule],
    template:  `
        <div class="flex w-full justify-content-end mt-3">
            <p-button type="button" label="Cancelar" icon="pi pi-times" (onClick)="closeDialog({ buttonType: 'Cancel', summary: 'No hay producto seleccionado' })" />
        </div> `
})
export class FooterHelper {
    constructor(public ref: DynamicDialogRef) {}

    closeDialog(data) {
        this.ref.close(data);
    }
}
