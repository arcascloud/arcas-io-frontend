#!/usr/bin/env node
/**
 * Patches broken PrimeNG 22.1.x type declarations.
 * PrimeNG 22.1.0 ships with a truncated primeng-table.d.ts and missing
 * primeng-tag.d.ts, primeng-toast.d.ts, primeng-toggleswitch.d.ts files.
 * It also lacks type declarations for @primeuix/themes/aura subpath.
 *
 * This script runs as a postinstall hook to fix these issues after every npm install.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PRIMENG_TYPES = path.join(ROOT, 'node_modules', 'primeng', 'types');

function patchTable() {
  const file = path.join(PRIMENG_TYPES, 'primeng-table.d.ts');
  if (!fs.existsSync(file)) {
    console.warn('[patch-primeng] primeng-table.d.ts not found, skipping');
    return;
  }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const lastLine = lines[lines.length - 1];
  if (lastLine.trim().endsWith('>;') || lastLine.trim() === '}') {
    console.log('[patch-primeng] primeng-table.d.ts already patched');
    return;
  }
  const goodLines = lines.slice(0, 1207);
  goodLines.push('    static ɵfac: _angular_core.ɵɵFactoryDeclaration<Table<any>, never>;');

  const tableInputs = [
    'frozenColumns', 'frozenValue', 'tableStyle', 'tableStyleClass', 'paginator',
    'pageLinks', 'rowsPerPageOptions', 'alwaysShowPaginator', 'paginatorPosition',
    'paginatorStyleClass', 'paginatorDropdownAppendTo', 'paginatorDropdownScrollHeight',
    'currentPageReportTemplate', 'showCurrentPageReport', 'showJumpToPageDropdown',
    'showJumpToPageInput', 'showFirstLastIcon', 'showPageLinks', 'defaultSortOrder',
    'sortMode', 'resetPageOnSort', 'selectionMode', 'selectionPageOnly',
    'contextMenuSelection', 'dataKey', 'metaKeySelection', 'rowSelectable', 'rowTrackBy',
    'lazy', 'lazyLoadOnInit', 'compareSelectionBy', 'csvSeparator', 'exportFilename',
    'filters', 'globalFilterFields', 'filterDelay', 'filterLocale', 'expandedRowKeys',
    'editingRowKeys', 'rowExpandMode', 'scrollable', 'rowGroupMode', 'scrollHeight',
    'virtualScroll', 'virtualScrollItemSize', 'virtualScrollOptions', 'virtualScrollDelay',
    'frozenWidth', 'contextMenu', 'resizableColumns', 'columnResizeMode',
    'reorderableColumns', 'loading', 'loadingIcon', 'showLoader', 'rowHover', 'customSort',
    'showInitialSortBadge', 'exportFunction', 'exportHeader', 'stateKey', 'stateStorage',
    'editMode', 'groupRowsBy', 'size', 'showGridlines', 'stripedRows', 'groupRowsByOrder',
    'paginatorLocale', 'value', 'columns', 'first', 'rows', 'totalRecords', 'sortField',
    'sortOrder', 'multiSortMeta', 'selection', 'selectAll'
  ];

  const tableOutputs = [
    'contextMenuSelectionChange', 'firstChange', 'rowsChange', 'totalRecordsChange',
    'selectionChange', 'selectAllChange', 'onRowSelect', 'onRowUnselect', 'onPage',
    'onSort', 'onFilter', 'onLazyLoad', 'onRowExpand', 'onRowCollapse',
    'onContextMenuSelect', 'onColResize', 'onColReorder', 'onRowReorder', 'onEditInit',
    'onEditComplete', 'onEditCancel', 'onHeaderCheckboxToggle', 'sortFunction',
    'onStateSave', 'onStateRestore'
  ];

  const inputsObj = tableInputs.map(i => {
    return `      "${i}": { "alias": "${i}"; "required": false; "isSignal": false; }`;
  }).join(';\n');
  const outputsObj = tableOutputs.map(o => `      "${o}": "${o}"`).join(';\n');

  const cmpDecl = `    static ɵcmp: _angular_core.ɵɵComponentDeclaration<Table<any>, "p-table", never, {\n${inputsObj}\n    }, {\n${outputsObj}\n    }, never, never, true, never>;`;

  goodLines.push(cmpDecl);
  goodLines.push('}');
  goodLines.push('');
  goodLines.push('declare class SortableColumn {');
  goodLines.push('    static ɵfac: _angular_core.ɵɵFactoryDeclaration<SortableColumn, never>;');
  goodLines.push('    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<SortableColumn, "[pSortableColumn]", never, { "pSortableColumn": { "alias": "pSortableColumn"; "required": false; "isSignal": false; }; }, {}, never, never, true, never>;');
  goodLines.push('}');
  goodLines.push('');
  goodLines.push('declare class SortIcon {');
  goodLines.push('    field: _angular_core.InputSignal<string>;');
  goodLines.push('    static ɵfac: _angular_core.ɵɵFactoryDeclaration<SortIcon, never>;');
  goodLines.push('    static ɵcmp: _angular_core.ɵɵComponentDeclaration<SortIcon, "p-sortIcon, p-sorticon", never, { "field": { "alias": "field"; "required": false; "isSignal": false; }; }, never, never, never, true, never>;');
  goodLines.push('}');
  goodLines.push('');
  goodLines.push('declare class TableModule {');
  goodLines.push('    static ɵfac: _angular_core.ɵɵFactoryDeclaration<TableModule, never>;');
  goodLines.push('    static ɵmod: _angular_core.ɵɵNgModuleDeclaration<TableModule, never, [typeof Table, typeof SortableColumn, typeof SortIcon], [typeof Table, typeof SortableColumn, typeof SortIcon]>;');
  goodLines.push('    static ɵinj: _angular_core.ɵɵInjectorDeclaration<TableModule>;');
  goodLines.push('}');
  goodLines.push('');
  goodLines.push('export { Table, TableModule, SortableColumn, SortIcon };');

  fs.writeFileSync(file, goodLines.join('\n'), 'utf8');
  console.log('[patch-primeng] Fixed primeng-table.d.ts');
}

function createTag() {
  const file = path.join(PRIMENG_TYPES, 'primeng-tag.d.ts');
  if (fs.existsSync(file)) {
    console.log('[patch-primeng] primeng-tag.d.ts already exists, skipping');
    return;
  }
  const content = `import * as _angular_core from '@angular/core';

declare class Tag {
    severity: _angular_core.InputSignal<string>;
    value: _angular_core.InputSignal<string>;
    icon: _angular_core.InputSignal<string>;
    rounded: _angular_core.InputSignal<boolean>;
    styleClass: _angular_core.InputSignal<string>;
    style: _angular_core.InputSignal<{ [klass: string]: any } | null>;
    iconTemplate: _angular_core.QueryRef<any>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<Tag, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<Tag, "p-tag", never, {
        "severity": { "alias": "severity"; "required": false; "isSignal": true; };
        "value": { "alias": "value"; "required": false; "isSignal": true; };
        "icon": { "alias": "icon"; "required": false; "isSignal": true; };
        "rounded": { "alias": "rounded"; "required": false; "isSignal": true; };
        "styleClass": { "alias": "styleClass"; "required": false; "isSignal": true; };
        "style": { "alias": "style"; "required": false; "isSignal": true; };
    }, never, never, never, true, never>;
}

declare class TagModule {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<TagModule, never>;
    static ɵmod: _angular_core.ɵɵNgModuleDeclaration<TagModule, never, [typeof Tag], [typeof Tag]>;
    static ɵinj: _angular_core.ɵɵInjectorDeclaration<TagModule>;
}

export { Tag, TagModule };
`;
  fs.writeFileSync(file, content, 'utf8');
  console.log('[patch-primeng] Created primeng-tag.d.ts');
}

function createToast() {
  const file = path.join(PRIMENG_TYPES, 'primeng-toast.d.ts');
  if (fs.existsSync(file)) {
    console.log('[patch-primeng] primeng-toast.d.ts already exists, skipping');
    return;
  }
  const content = `import * as _angular_core from '@angular/core';

declare class Toast {
    key: _angular_core.InputSignal<string>;
    autoZIndex: _angular_core.InputSignal<boolean>;
    baseZIndex: _angular_core.InputSignal<number>;
    life: _angular_core.InputSignal<number>;
    position: _angular_core.InputSignal<string>;
    mode: _angular_core.InputSignal<string>;
    stackGap: _angular_core.InputSignal<number>;
    stackVisibleLimit: _angular_core.InputSignal<number>;
    preventOpenDuplicates: _angular_core.InputSignal<boolean>;
    preventDuplicates: _angular_core.InputSignal<boolean>;
    motionOptions: _angular_core.InputSignal<any>;
    breakpoints: _angular_core.InputSignal<any>;
    onClose: _angular_core.OutputEmitterRef<any>;
    messageTemplate: _angular_core.QueryRef<any>;
    headlessTemplate: _angular_core.QueryRef<any>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<Toast, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<Toast, "p-toast", never, {
        "key": { "alias": "key"; "required": false; "isSignal": true; };
        "autoZIndex": { "alias": "autoZIndex"; "required": false; "isSignal": true; };
        "baseZIndex": { "alias": "baseZIndex"; "required": false; "isSignal": true; };
        "life": { "alias": "life"; "required": false; "isSignal": true; };
        "position": { "alias": "position"; "required": false; "isSignal": true; };
        "mode": { "alias": "mode"; "required": false; "isSignal": true; };
        "stackGap": { "alias": "stackGap"; "required": false; "isSignal": true; };
        "stackVisibleLimit": { "alias": "stackVisibleLimit"; "required": false; "isSignal": true; };
        "preventOpenDuplicates": { "alias": "preventOpenDuplicates"; "required": false; "isSignal": true; };
        "preventDuplicates": { "alias": "preventDuplicates"; "required": false; "isSignal": true; };
        "motionOptions": { "alias": "motionOptions"; "required": false; "isSignal": true; };
        "breakpoints": { "alias": "breakpoints"; "required": false; "isSignal": true; };
    }, {
        "onClose": "onClose";
    }, never, never, true, never>;
}

declare class ToastModule {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<ToastModule, never>;
    static ɵmod: _angular_core.ɵɵNgModuleDeclaration<ToastModule, never, [typeof Toast], [typeof Toast]>;
    static ɵinj: _angular_core.ɵɵInjectorDeclaration<ToastModule>;
}

export { Toast, ToastModule };
`;
  fs.writeFileSync(file, content, 'utf8');
  console.log('[patch-primeng] Created primeng-toast.d.ts');
}

function createToggleSwitch() {
  const file = path.join(PRIMENG_TYPES, 'primeng-toggleswitch.d.ts');
  if (fs.existsSync(file)) {
    console.log('[patch-primeng] primeng-toggleswitch.d.ts already exists, skipping');
    return;
  }
  const content = `import * as _angular_core from '@angular/core';

declare class ToggleSwitch {
    tabindex: _angular_core.InputSignal<number>;
    inputId: _angular_core.InputSignal<string>;
    readonly: _angular_core.InputSignal<boolean>;
    trueValue: _angular_core.InputSignal<any>;
    falseValue: _angular_core.InputSignal<any>;
    ariaLabel: _angular_core.InputSignal<string>;
    size: _angular_core.InputSignal<string>;
    ariaLabelledBy: _angular_core.InputSignal<string>;
    autofocus: _angular_core.InputSignal<boolean>;
    onChange: _angular_core.OutputEmitterRef<any>;
    handleTemplate: _angular_core.QueryRef<any>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<ToggleSwitch, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<ToggleSwitch, "p-toggleswitch", never, {
        "tabindex": { "alias": "tabindex"; "required": false; "isSignal": true; };
        "inputId": { "alias": "inputId"; "required": false; "isSignal": true; };
        "readonly": { "alias": "readonly"; "required": false; "isSignal": true; };
        "trueValue": { "alias": "trueValue"; "required": false; "isSignal": true; };
        "falseValue": { "alias": "falseValue"; "required": false; "isSignal": true; };
        "ariaLabel": { "alias": "ariaLabel"; "required": false; "isSignal": true; };
        "size": { "alias": "size"; "required": false; "isSignal": true; };
        "ariaLabelledBy": { "alias": "ariaLabelledBy"; "required": false; "isSignal": true; };
        "autofocus": { "alias": "autofocus"; "required": false; "isSignal": true; };
    }, {
        "onChange": "onChange";
    }, never, never, true, never>;
}

declare class ToggleSwitchModule {
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<ToggleSwitchModule, never>;
    static ɵmod: _angular_core.ɵɵNgModuleDeclaration<ToggleSwitchModule, never, [typeof ToggleSwitch], [typeof ToggleSwitch]>;
    static ɵinj: _angular_core.ɵɵInjectorDeclaration<ToggleSwitchModule>;
}

export { ToggleSwitch, ToggleSwitchModule };
`;
  fs.writeFileSync(file, content, 'utf8');
  console.log('[patch-primeng] Created primeng-toggleswitch.d.ts');
}

function createAuraTheme() {
  const auraDir = path.join(ROOT, 'node_modules', '@primeuix', 'themes', 'dist', 'aura');
  const dtsFile = path.join(auraDir, 'index.d.ts');
  if (fs.existsSync(dtsFile)) {
    console.log('[patch-primeng] @primeuix/themes/aura index.d.ts already exists');
    return;
  }
  const content = `declare const Aura: any;
export default Aura;
`;
  fs.writeFileSync(dtsFile, content, 'utf8');
  console.log('[patch-primeng] Created @primeuix/themes/aura/index.d.ts');
}

try {
  if (!fs.existsSync(PRIMENG_TYPES)) {
    console.warn('[patch-primeng] primeng/types directory not found, skipping all patches');
    process.exit(0);
  }
  patchTable();
  createTag();
  createToast();
  createToggleSwitch();
  createAuraTheme();
  console.log('[patch-primeng] All patches applied successfully');
} catch (err) {
  console.error('[patch-primeng] Error applying patches:', err.message);
}
