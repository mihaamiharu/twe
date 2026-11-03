export interface OgResources {
  inspectorImage?: string;
  regularFont: string;
  boldFont: string;
}

export interface OgRenderOptions {
  width: number;
  height: number;
  fonts: Array<{
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
    style: 'normal';
  }>;
}
