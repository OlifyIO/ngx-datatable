import { Component } from '@angular/core';
import { ColumnMode } from 'projects/swimlane/ngx-datatable/src/public-api';

@Component({
  selector: 'column-reorder-demo',
  styles: [``],
  template: `
    <div>
      <h3>
        Reorder Column
        <small>
          <a
            href="https://github.com/swimlane/ngx-datatable/blob/master/src/app/columns/column-reorder.component.ts"
            target="_blank"
          >
            Source
          </a>
        </small>
      </h3>
      <ngx-datatable
        class="material"
        [rows]="rows"
        [loadingIndicator]="loadingIndicator"
        [columns]="columns"
        [columnMode]="ColumnMode.force"
        [headerHeight]="50"
        [footerHeight]="50"
        rowHeight="auto"
        [reorderable]="reorderable"
        [swapColumns]="swapColumns"
      >
      </ngx-datatable>
    </div>
  `
})
export class ColumnReorderComponent {
  rows = [];
  loadingIndicator = true;
  reorderable = true;
  swapColumns = false;

  columns = [{ prop: 'name' }, { name: 'Gender' }, { name: 'ZAge', width: 60 }, { name: 'Company' }];

  ColumnMode = ColumnMode;

  constructor() {
    this.fetch(data => {
      this.rows = data;
      setTimeout(() => {
        this.loadingIndicator = false;
      }, 1500);
    });
  }

  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `assets/data/company.json`);

    req.onload = () => {
      cb(JSON.parse(req.response));
    };

    req.send();
  }
}
