import { columnsByPin, columnsTotalWidth } from './column';

/**
 * Calculates the Total Flex Grow
 */
export function getTotalFlexGrow(columns: any[]) {
  let totalFlexGrow = 0;

  for (const c of columns) {
    totalFlexGrow += c.flexGrow || 0;
  }

  return totalFlexGrow;
}

/**
 * Adjusts the column widths.
 * Inspired by: https://github.com/facebook/fixed-data-table/blob/master/src/FixedDataTableWidthHelper.js
 */
export function adjustColumnWidths(allColumns: any, expectedWidth: any) {
  const columnsWidth = columnsTotalWidth(allColumns);
  const totalFlexGrow = getTotalFlexGrow(allColumns);

  if (columnsWidth !== expectedWidth) {
    for (const columnIdx in allColumns) {
      if (allColumns[columnIdx].canAutoResize) {
        allColumns[columnIdx] = {
          ...allColumns[columnIdx],
          width: 0
        };
      }
    }

    const colsByGroup = columnsByPin(allColumns);
    scaleColumns(colsByGroup, expectedWidth, totalFlexGrow);
  }
}

/**
 * Resizes columns based on the flexGrow property, while respecting manually set widths
 */
function scaleColumns(colsByGroup: any, maxWidth: any, totalFlexGrow: any) {
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
  allColumns: any[],
  expectedWidth: number,
  startIdx: number,
  allowBleed: boolean,
  defaultColWidth: number = 300
) {
  const columnsIdxToResize = allColumns
    .map((c, i) => ({ c, i }))
    .slice(startIdx + 1, allColumns.length)
    .filter(({ c, i }) => {
      return c.canAutoResize !== false;
    })
    .map(({ c, i }) => i);

  for (const columnIdx of columnsIdxToResize) {
    let column = allColumns[columnIdx];
    if (!column.$$oldWidth) {
      column = {
        ...column,
        $$oldWidth: column.width
      };
      allColumns[columnIdx] = column;
    }
  }

  let additionWidthPerColumn = 0;
  let exceedsWindow = false;
  let contentWidth = getContentWidth(allColumns, defaultColWidth);
  let remainingWidth = expectedWidth - contentWidth;
  let columnsToResizeLength = columnsIdxToResize.length;
  const columnsIdxProcessed: number[] = [];
  const remainingWidthLimit = 1; // when to stop

  // This loop takes care of the
  do {
    additionWidthPerColumn = remainingWidth / columnsToResizeLength;
    exceedsWindow = contentWidth >= expectedWidth;

    for (const columnIdx of columnsIdxToResize) {
      const column = allColumns[columnIdx];
      if (exceedsWindow && allowBleed) {
        column.width = column.$$oldWidth || column.width || defaultColWidth;
      } else {
        const newSize = (column.width || defaultColWidth) + additionWidthPerColumn;

        if (column.minWidth && newSize < column.minWidth) {
          column.width = column.minWidth;
          columnsIdxProcessed.push(columnIdx);
          columnsToResizeLength--;
        } else if (column.maxWidth && newSize > column.maxWidth) {
          column.width = column.maxWidth;
          columnsIdxProcessed.push(columnIdx);
          columnsToResizeLength--;
        }
      }
      column.width = Math.max(0, column.width);
    }

    additionWidthPerColumn = remainingWidth / columnsToResizeLength;
    for (const columnIdx of columnsIdxToResize) {
      const column = allColumns[columnIdx];
      const newSize = (column.width || defaultColWidth) + additionWidthPerColumn;
      if (!column.minWidth && !column.maxWidth) {
        column.width = newSize;
      }
      column.width = Math.max(0, column.width);
    }

    contentWidth = getContentWidth(allColumns);
    remainingWidth = expectedWidth - contentWidth;
    removeProcessedColumns(columnsIdxToResize, columnsIdxProcessed);
  } while (remainingWidth > remainingWidthLimit && columnsIdxToResize.length !== 0);
}

/**
 * Remove the processed columns from the current active columns.
 */
function removeProcessedColumns(columnsIdxToResize: any[], columnsIdxProcessed: any[]) {
  for (const column of columnsIdxProcessed) {
    const index = columnsIdxToResize.indexOf(column);
    columnsIdxToResize.splice(index, 1);
  }
}

/**
 * Gets the width of the columns
 */
function getContentWidth(allColumns: any, defaultColWidth: number = 300): number {
  let contentWidth = 0;

  for (const column of allColumns) {
    contentWidth += column.width || defaultColWidth;
  }

  return contentWidth;
}
