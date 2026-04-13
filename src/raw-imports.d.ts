declare module '*.hbs?raw' {
  const content: string;
  export default content;
}

declare module '*.css?raw' {
  const content: string;
  export default content;
}

declare module 'qrcode-generator' {
  type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

  type QRCode = {
    addData(data: string): void;
    make(): void;
    createSvgTag(cellSize?: number, margin?: number): string;
  };

  const createQrCode: (typeNumber: number, errorCorrectionLevel: ErrorCorrectionLevel) => QRCode;

  export default createQrCode;
}
