import { forceFillColumnWidths } from './math';

describe('Math function', () => {
  describe('forceFillColumnWidths', () => {
    describe('when column expanded', () => {
      it('should resize only columns right to the resized column', () => {
        const columns = [
          { prop: 'id', width: 250, canAutoResize: true, visible: true },
          { prop: 'name', width: 400, canAutoResize: true, visible: true },
          { prop: 'email', width: 250, canAutoResize: true, visible: true }
        ];

        const result = forceFillColumnWidths(columns, 1000, 1); // Column 2 expanded from 250 to 400

        expect(result[0].width).toBe(250); // Not changed
        expect(result[1].width).toBe(400);
        expect(result[2].width).toBe(350);
      });
    });

    describe('when column compressed', () => {
      it('should resize only columns right to the resized column', () => {
        const columns = [
          { prop: 'id', width: 250, canAutoResize: true, visible: true },
          { prop: 'name', width: 400, canAutoResize: true, visible: true },
          { prop: 'email', width: 250, canAutoResize: true, visible: true }
        ];

        const result = forceFillColumnWidths(columns, 750, 1); // Column 2 contracted from 250 to 180

        expect(result[0].width).toBe(250); // Not changed
        expect(result[1].width).toBe(400);
        expect(result[2].width).toBe(100);
      });
    });
  });
});
