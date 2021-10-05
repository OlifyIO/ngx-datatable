import { TableColumn } from '../types/table-column.type';
import { columnsByPin, columnsTotalWidth } from './column';

/**
 * Calculates the Total Flex Grow
 */
export function getTotalFlexGrow(columns: TableColumn[]) {
  let totalFlexGrow = 0;

  for (const c of columns) {
    if (c.visible) {
      totalFlexGrow += c.flexGrow || 0;
    }
  }

  return totalFlexGrow;
}

/**
 * Adjusts the column widths.
 * Inspired by: https://github.com/facebook/fixed-data-table/blob/master/src/FixedDataTableWidthHelper.js
 */
export function adjustColumnWidths(allColumns: TableColumn[], expectedWidth: number) {
  const columnsWidth = columnsTotalWidth(allColumns);
  const totalFlexGrow = getTotalFlexGrow(allColumns);

  if (columnsWidth !== expectedWidth) {
    const columns = allColumns.map(c => {
      if (c.canAutoResize && c.visible) {
        return {
          ...c,
          width: 0
        };
      } else {
        return c;
      }
    });

    const colsByGroup = columnsByPin(columns.filter(c => c.visible));
    scaleColumns(colsByGroup, expectedWidth, totalFlexGrow);
    return columns;
  }

  return allColumns;
}

/**
 * Resizes columns based on the flexGrow property, while respecting manually set widths
 */
function scaleColumns(colsByGroup: any, maxWidth: number, totalFlexGrow: number) {
  // calculate total width and flexgrow points for coulumns that can be resized
  for (const attr in colsByGroup) {
    for (const columnIdx in colsByGroup[attr]) {
      const column = colsByGroup[attr][columnIdx];
      if (!column.canAutoResize) {
        maxWidth -= column.width;
        totalFlexGrow -= column.flexGrow ? column.flexGrow : 0;
      }
    }
  }

  const hasMinWidth = {};
  let remainingWidth = maxWidth;

  // resize columns until no width is left to be distributed
  do {
    const widthPerFlexPoint = remainingWidth / totalFlexGrow;
    remainingWidth = 0;

    for (const attr in colsByGroup) {
      for (const column of colsByGroup[attr]) {
        // if the column can be resize and it hasn't reached its minimum width yet
        if (column.canAutoResize && !hasMinWidth[column.prop]) {
          const newWidth = column.width + column.flexGrow * widthPerFlexPoint;
          if (column.minWidth !== undefined && newWidth < column.minWidth) {
            remainingWidth += newWidth - column.minWidth;
            column.width = column.minWidth;
            hasMinWidth[column.prop] = true;
          } else {
            column.width = newWidth;
          }
        }
      }
    }
  } while (remainingWidth !== 0);
}

/**
 * Forces the width of the columns to
 * distribute equally but overflowing when necessary
 *
 * Rules:
 *
 *  - If combined withs are less than the total width of the grid,
 *    proportion the widths given the min / max / normal widths to fill the width.
 *
 *  - If the combined widths, exceed the total width of the grid,
 *    use the standard widths.
 *
 *  - If a column is resized, it should always use that width
 *
 *  - The proportional widths should never fall below min size if specified.
 *
 *  - If the grid starts off small but then becomes greater than the size ( + / - )
 *    the width should use the original width; not the newly proportioned widths.
 */
export function forceFillColumnWidths(
  allColumns: TableColumn[],
  expectedWidth: number,
  startIdx: number,
  defaultColWidth: number = 300
): TableColumn[] {
  if (expectedWidth === 0) {
    return allColumns;
  }

  const columnsIdxToResize = allColumns
    .map((c, i) => ({ c, i }))
    .slice(startIdx + 1, allColumns.length)
    .filter(({ c, i }) => {
      return c.canAutoResize !== false && c.visible;
    })
    .map(({ c, i }) => i);

  const columns = allColumns.map((x, i) => {
    if (!x.visible) {
      return x;
    }

    if (!x.width) {
      const width = Math.max(
        x.minWidth ?? 0,
        x.maxWidth && x.maxWidth < defaultColWidth ? x.maxWidth : defaultColWidth
      );
      x = {
        ...x,
        width
      };
    }

    if (x.width < (x.minWidth ?? 0)) {
      x = {
        ...x,
        width: x.minWidth ?? 0
      };
    } else if (x.maxWidth && x.width > x.maxWidth) {
      x = {
        ...x,
        width: x.maxWidth
      };
    } else if (i >= startIdx) {
      x = {
        ...x
      };
    }

    return x;
  });

  let contentWidth = getContentWidth(columns);
  let remainingWidth = expectedWidth - contentWidth;

  if (remainingWidth === 0 || columnsIdxToResize.length === 0) {
    return columns;
  }

  const originalWidths = new Map<number, number>();
  columnsIdxToResize.forEach(i => originalWidths.set(i, columns[i].width));

  do {
    const totalOriginalWidths = columnsIdxToResize.map(i => originalWidths.get(i)).reduce((a, b) => a + b, 0);
    const additionWidthPerOriginalWidth = remainingWidth / totalOriginalWidths;

    for (const columnsIdx of columnsIdxToResize) {
      const additionWidthPerColumn = additionWidthPerOriginalWidth * originalWidths.get(columnsIdx);
      columns[columnsIdx].width += additionWidthPerColumn;
    }

    if (remainingWidth > 0) {
      for (let i = 0; i < columnsIdxToResize.length; i++) {
        const column = columns[columnsIdxToResize[i]];
        if (column.width >= column.maxWidth) {
          column.width = column.maxWidth;
          columnsIdxToResize.splice(i, 1);
          i--;
        }
      }
    } else {
      for (let i = 0; i < columnsIdxToResize.length; i++) {
        const column = columns[columnsIdxToResize[i]];
        const minWidth = column.minWidth ?? 0;
        if (column.width <= minWidth) {
          column.width = minWidth;
          columnsIdxToResize.splice(i, 1);
          i--;
        }
      }
    }

    contentWidth = getContentWidth(columns);
    remainingWidth = expectedWidth - contentWidth;
  } while (remainingWidth > 1 && columnsIdxToResize.length !== 0);

  if (remainingWidth !== 0) {
    if (startIdx !== -1) {
      columns[startIdx].width += remainingWidth;
      const minWidth = columns[startIdx].minWidth ?? 0;
      if (minWidth && columns[startIdx].minWidth > columns[startIdx].width) {
        columns[startIdx].width = columns[startIdx].minWidth;
      } else if (columns[startIdx].maxWidth && columns[startIdx].maxWidth < columns[startIdx].width) {
        columns[startIdx].width = columns[startIdx].maxWidth;
      }
    } else if (columnsIdxToResize.length) {
      columns[columnsIdxToResize[columnsIdxToResize.length - 1]].width += remainingWidth;
    }
  }

  return columns;
}

/**
 * Gets the width of the columns
 */
function getContentWidth(allColumns: TableColumn[]): number {
  let contentWidth = 0;

  for (const column of allColumns) {
    if (column.visible) {
      contentWidth += column.width;
    }
  }

  return contentWidth;
}
