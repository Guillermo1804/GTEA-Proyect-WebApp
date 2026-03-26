import { Pipe, PipeTransform } from '@angular/core';

/**
 * Acorta el texto mostrado en <option> para que el menú nativo del select
 * no sea más ancho que el control (especialmente en Windows/Chrome).
 * Usar [attr.title] con el texto completo para tooltip.
 */
@Pipe({ name: 'truncateSelectLabel', standalone: true })
export class TruncateSelectLabelPipe implements PipeTransform {
  transform(value: string | null | undefined, maxLen = 36): string {
    if (value == null || value === '') return '';
    const n = Math.max(4, maxLen);
    if (value.length <= n) return value;
    return value.slice(0, n - 1) + '…';
  }
}
