import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerationOptions } from '../types';

export async function generate3DVisualization(
  options: GenerationOptions,
  onProgress: (progress: number) => void
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const generatedImages: string[] = [];

  const totalFrames = options.outputType === 'static' ? 1 : options.rotationAngles;

  for (let i = 0; i < totalFrames; i++) {
    const angle = totalFrames === 1 ? 30 : Math.round((360 / totalFrames) * i);
    
    const reflectionText = options.reflections ? 'Inclua reflexos sutis e realistas no produto e na superfície.' : 'Não inclua reflexos.';
    const watermarkText = options.watermark ? `Adicione uma marca d'água discreta com o texto "${options.watermark}" no canto inferior direito.` : '';

    const prompt = `
      Tarefa: Gere uma única visualização de produto 3D fotorrealista com base na imagem 2D fornecida.

      Contexto:
      - Produto: ${options.category}
      - Imagem Original: [Anexada]
      
      Instruções Detalhadas:
      1.  **Modelo 3D:** Interprete a imagem 2D para criar uma representação 3D verossímil do produto. Mantenha o design, cor, textura e marca do produto original com fidelidade absoluta.
      2.  **Ângulo de Visão:** Renderize o produto rotacionado em ${angle} graus no eixo vertical (yaw). Para uma imagem estática, um ângulo de 30 graus oferece uma boa perspectiva 3D.
      3.  **Cenário (Estilo do Mockup):** Coloque o produto em um cenário de "${options.mockupStyle}".
      4.  **Iluminação:** Aplique um esquema de "${options.lighting}".
      5.  **Efeitos Visuais:** ${reflectionText}
      6.  **Qualidade:** A imagem final deve ser de alta qualidade, adequada para uma resolução de ${options.resolution}.
      7.  **Marca d'água:** ${watermarkText}

      Requisito Crítico: O resultado DEVE ser APENAS a imagem gerada, sem nenhum texto, legenda ou explicação adicional.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: options.base64Image,
                mimeType: options.imageMimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      // Check for prompt feedback which indicates a potential issue (e.g., safety blocking)
      if (response.promptFeedback?.blockReason) {
        console.error('Geração bloqueada:', response.promptFeedback);
        let userMessage = `A geração foi bloqueada. Motivo: ${response.promptFeedback.blockReason}.`;
        if (response.promptFeedback.blockReason === 'SAFETY') {
          userMessage = 'A geração foi bloqueada por motivos de segurança. Por favor, tente usar uma imagem ou descrição diferente que esteja de acordo com as políticas de segurança.';
        }
        throw new Error(userMessage);
      }

      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData
      );

      if (imagePart?.inlineData) {
        const base64ImageData = imagePart.inlineData.data;
        generatedImages.push(`data:${options.imageMimeType};base64,${base64ImageData}`);
      } else {
        // This case handles when the API returns a response but without an image.
        console.error('A API não retornou uma imagem válida para o frame ' + (i + 1), JSON.stringify(response, null, 2));
        const finishReason = response.candidates?.[0]?.finishReason;
        let errorMessage = `A API não retornou uma imagem válida para o frame ${i + 1}.`;
        if (finishReason) {
          errorMessage += ` Motivo: ${finishReason}.`;
        }
        errorMessage += ' Tente ajustar as configurações ou a imagem de entrada.';
        throw new Error(errorMessage);
      }
      
      onProgress(Math.round(((i + 1) / totalFrames) * 100));
    } catch (error) {
      console.error(`Erro ao gerar frame ${i + 1}:`, error);
      // Re-throw the specific error message we created, or create a more generic one for other errors.
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Falha na geração no frame ${i + 1}. Verifique o console para mais detalhes.`);
    }
  }

  return generatedImages;
}