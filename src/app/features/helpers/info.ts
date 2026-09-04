import { Component} from '@angular/core';
import { DialogService, DynamicDialog, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

@Component({
    providers: [DialogService, MessageService],
    standalone: true,
    imports:[ButtonModule],
    template: `<div>
    <p>
        El numero total de registros  en la lista son: <strong>{{ totalItems }}</strong> .
    </p>
    <div class="flex justify-content-end">
        <p-button type="button" label="Close" (onClick)="close()" />
    </div>
</div>`
})
export class InfoHelper {
    totalItems: number = 0;

    instance: DynamicDialog | undefined;

    constructor(public ref: DynamicDialogRef, private dialogService: DialogService) {
        this.instance = this.dialogService.getInstance(this.ref);
    }

    ngOnInit() {
        if (this.instance && this.instance.data) {
            this.totalItems = this.instance.data['totalItems'];
        }
    }

    close() {
        this.ref.close();
    }

    ngOnDestroy() {
        if (this.ref) {
            this.ref.close();
        }
    }
}
