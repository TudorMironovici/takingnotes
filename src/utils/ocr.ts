import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
  preprocessingTime?: number;
}

// Image preprocessing configuration
interface PreprocessConfig {
  upscaleFactor: number;
  contrastEnhancement: boolean;
  binarization: boolean;
  noiseReduction: boolean;
}

/**
 * Upscale image for better OCR accuracy
 */
function upscaleImage(canvas: HTMLCanvasElement, factor: number = 2): HTMLCanvasElement {
  const upscaledCanvas = document.createElement('canvas');
  upscaledCanvas.width = canvas.width * factor;
  upscaledCanvas.height = canvas.height * factor;
  const ctx = upscaledCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, upscaledCanvas.width, upscaledCanvas.height);
  
  return upscaledCanvas;
}

/**
 * Enhance contrast using adaptive histogram equalization
 */
function enhanceContrast(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = canvas.width;
  resultCanvas.height = canvas.height;
  const ctx = resultCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // Draw original
  ctx.drawImage(canvas, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate histogram and apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
  // Simplified version using global contrast stretching
  let min = 255, max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    min = Math.min(min, gray);
    max = Math.max(max, gray);
  }
  
  const range = max - min || 1;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const stretched = ((gray - min) / range) * 255;
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }
  
  ctx.putImageData(imageData, 0, 0);
  return resultCanvas;
}

/**
 * Convert to binary (black and white) using Otsu's method
 */
function binarizeImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = canvas.width;
  resultCanvas.height = canvas.height;
  const ctx = resultCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  ctx.drawImage(canvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  const grayscale: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    histogram[gray]++;
    grayscale.push(gray);
  }
  
  // Otsu's method to find optimal threshold
  const total = canvas.width * canvas.height;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  
  let sumB = 0;
  let countB = 0;
  let maxVar = 0;
  let threshold = 0;
  
  for (let i = 0; i < 256; i++) {
    countB += histogram[i];
    if (countB === 0) continue;
    
    const countF = total - countB;
    if (countF === 0) break;
    
    sumB += i * histogram[i];
    const meanB = sumB / countB;
    const meanF = (sum - sumB) / countF;
    
    const var_ = countB * countF * (meanB - meanF) * (meanB - meanF);
    if (var_ > maxVar) {
      maxVar = var_;
      threshold = i;
    }
  }
  
  // Apply threshold
  for (let i = 0; i < grayscale.length; i++) {
    const binary = grayscale[i] > threshold ? 255 : 0;
    const idx = i * 4;
    data[idx] = binary;
    data[idx + 1] = binary;
    data[idx + 2] = binary;
  }
  
  ctx.putImageData(imageData, 0, 0);
  return resultCanvas;
}

/**
 * Reduce noise using median filter
 */
function reduceNoise(canvas: HTMLCanvasElement, radius: number = 1): HTMLCanvasElement {
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = canvas.width;
  resultCanvas.height = canvas.height;
  const ctx = resultCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  ctx.drawImage(canvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const newData = new Uint8ClampedArray(data);
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const values: number[] = [];
      
      // Collect surrounding pixels
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          values.push(data[idx]);
        }
      }
      
      // Find median
      values.sort((a, b) => a - b);
      const median = values[Math.floor(values.length / 2)];
      
      const idx = (y * width + x) * 4;
      newData[idx] = median;
      newData[idx + 1] = median;
      newData[idx + 2] = median;
    }
  }
  
  imageData.data.set(newData);
  ctx.putImageData(imageData, 0, 0);
  return resultCanvas;
}

/**
 * Apply all preprocessing steps to improve OCR accuracy
 */
function preprocessImage(canvas: HTMLCanvasElement, config: PreprocessConfig): HTMLCanvasElement {
  let processed = canvas;
  
  if (config.upscaleFactor > 1) {
    processed = upscaleImage(processed, config.upscaleFactor);
  }
  
  if (config.noiseReduction) {
    processed = reduceNoise(processed, 1);
  }
  
  if (config.contrastEnhancement) {
    processed = enhanceContrast(processed);
  }
  
  if (config.binarization) {
    processed = binarizeImage(processed);
  }
  
  return processed;
}

/**
 * Perform OCR on a canvas element to extract text from handwritten notes
 * @param canvas - The canvas element containing the handwritten notes
 * @param language - Language code (default: 'eng' for English)
 * @param onProgress - Optional callback to report OCR progress (0-100)
 * @returns Promise containing the extracted text and metadata
 */
export async function performOCR(
  canvas: HTMLCanvasElement,
  language: string = 'eng',
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const startTime = performance.now();
  const preprocessingStartTime = performance.now();

  try {
    // Preprocess image for better accuracy
    const preprocessConfig: PreprocessConfig = {
      upscaleFactor: 2, // 2x upscaling for better detail
      contrastEnhancement: true,
      binarization: true,
      noiseReduction: true,
    };

    const preprocessedCanvas = preprocessImage(canvas, preprocessConfig);
    const preprocessingTime = performance.now() - preprocessingStartTime;

    // Convert preprocessed canvas to image URL
    const imageUrl = preprocessedCanvas.toDataURL('image/png');

    // Initialize Tesseract worker with optimized settings
    const worker = await Tesseract.createWorker(language);

    // Update progress to 50% before recognition
    onProgress?.(50);

    // Recognize text from preprocessed image
    // The preprocessing (upscaling, contrast enhancement, binarization, noise reduction)
    // significantly improves accuracy for handwritten text
    const result = await worker.recognize(imageUrl);

    // Update progress to 100%
    onProgress?.(100);

    // Extract text and confidence
    const text = result.data.text || '';
    const confidence = result.data.confidence || 0;

    // Terminate worker
    await worker.terminate();

    const processingTime = performance.now() - startTime;

    return {
      text: text.trim(),
      confidence,
      language,
      processingTime,
      preprocessingTime,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`Failed to perform OCR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Perform OCR on multiple canvas elements (useful for animation frames)
 * @param canvases - Array of canvas elements
 * @param language - Language code
 * @param onProgress - Optional callback to report overall progress
 * @returns Promise containing array of extracted text from each canvas
 */
export async function performBatchOCR(
  canvases: HTMLCanvasElement[],
  language: string = 'eng',
  onProgress?: (progress: number) => void
): Promise<OCRResult[]> {
  const results: OCRResult[] = [];

  for (let i = 0; i < canvases.length; i++) {
    const result = await performOCR(canvases[i], language, (progress) => {
      const overallProgress = ((i / canvases.length) * 100) + (progress / canvases.length);
      onProgress?.(Math.round(overallProgress));
    });
    results.push(result);
  }

  return results;
}

/**
 * Download extracted text as a .txt file
 * @param text - The text content to download
 * @param filename - Optional filename (default: takingnotes_extracted_text.txt)
 */
export function downloadTextFile(text: string, filename: string = `takingnotes_extracted_text_${Date.now()}.txt`): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Copy text to clipboard
 * @param text - The text to copy
 * @returns Promise that resolves when text is copied
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw new Error('Failed to copy text to clipboard');
  }
}
