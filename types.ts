
export type OutputType = 'static' | 'gif' | 'video';

export interface FormData {
  productImage: File | null;
  imagePreviewUrl: string | null;
  category: string;
  mockupStyle: string;
  outputType: OutputType;
  rotationAngles: number;
  lighting: string;
  reflections: boolean;
  resolution: string;
  watermark: string;
}

export interface GenerationOptions extends Omit<FormData, 'productImage' | 'imagePreviewUrl'> {
  base64Image: string;
  imageMimeType: string;
}
