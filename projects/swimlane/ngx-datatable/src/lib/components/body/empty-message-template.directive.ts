import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[ngx-datatable-empty-message-template]'
})
export class DatatableEmptyMessageTemplateDirective {
  constructor(public template: TemplateRef<any>) {}
}
