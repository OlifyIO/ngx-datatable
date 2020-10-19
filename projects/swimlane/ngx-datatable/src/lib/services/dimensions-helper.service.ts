import { Injectable } from '@angular/core';

/**
 * Gets the width of the scrollbar.  Nesc for windows
 * http://stackoverflow.com/a/13382873/888165
 */
@Injectable()
export class DimensionsHelper {
  getClientDimensions(element: Element): { clientWidth: number; clientHeight: number } {
    return {
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight
    };
  }
}
