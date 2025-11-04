
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import type { FormData, OutputType } from './types';
import { CATEGORIES, MOCKUP_STYLES, OUTPUT_TYPES, ROTATION_ANGLES, LIGHTING_STYLES, RESOLUTIONS } from './constants';
import { generate3DVisualization } from './services/geminiService';
import { UploadIcon, SparklesIcon, InfoIcon } from './components/icons';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    productImage: null,
    imagePreviewUrl: null,
    category: CATEGORIES[0],
    mockupStyle: MOCKUP_STYLES[0],
    outputType: 'gif',
    rotationAngles: 24,
    lighting: LIGHTING_STYLES[0],
    reflections: true,
    resolution: RESOLUTIONS[1],
    watermark: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        productImage: file,
        imagePreviewUrl: URL.createObjectURL(file),
      }));
    }
  }, []);
  
  const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const [header, base64] = result.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
            resolve({ base64, mimeType });
        };
        reader.onerror = (error) => reject(error);
    });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productImage) {
      setError('Por favor, faça o upload de uma imagem do produto.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setProgress(0);

    try {
        const { base64, mimeType } = await fileToBase64(formData.productImage);
        const options = {
            ...formData,
            base64Image: base64,
            imageMimeType: mimeType,
        };
        const images = await generate3DVisualization(options, setProgress);
        setGeneratedImages(images);
    } catch (err: any) {
        setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (generatedImages.length > 1 && (formData.outputType === 'gif' || formData.outputType === 'video')) {
      const interval = setInterval(() => {
        setCurrentFrame(prevFrame => (prevFrame + 1) % generatedImages.length);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [generatedImages, formData.outputType]);
  
  const FormInput:React.FC<{label: string, name: string, children: React.ReactNode}> = ({label, name, children}) => (
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        {children}
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Gerador de Mockup 3D com IA
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Transforme uma imagem 2D do seu produto em uma visualização 3D ou 360° imersiva e profissional.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Coluna do Formulário */}
          <aside className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-white">Configurações de Geração</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                
                <FormInput label="1. Imagem do Produto" name="productImage">
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {formData.imagePreviewUrl ? (
                                <img src={formData.imagePreviewUrl} alt="Pré-visualização" className="mx-auto h-32 w-32 object-cover rounded-md" />
                            ) : (
                                <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                            )}
                            <div className="flex text-sm text-gray-400">
                                <label htmlFor="productImage" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-indigo-500 px-2 py-1">
                                    <span>Selecione um arquivo</span>
                                    <input id="productImage" name="productImage" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                                </label>
                                <p className="pl-1">ou arraste e solte</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
                        </div>
                    </div>
                </FormInput>

                <FormInput label="2. Categoria do Produto" name="category">
                    <select id="category" name="category" value={formData.category} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                    </select>
                </FormInput>

                <FormInput label="3. Estilo do Mockup" name="mockupStyle">
                    <select id="mockupStyle" name="mockupStyle" value={formData.mockupStyle} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {MOCKUP_STYLES.map(style => <option key={style}>{style}</option>)}
                    </select>
                </FormInput>

                 <FormInput label="4. Tipo de Saída" name="outputType">
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-700 p-1">
                        {OUTPUT_TYPES.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, outputType: type.id as OutputType }))}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${formData.outputType === type.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                </FormInput>
                
                {formData.outputType !== 'static' && (
                  <FormInput label="Ângulos de Rotação" name="rotationAngles">
                    <select id="rotationAngles" name="rotationAngles" value={formData.rotationAngles} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {ROTATION_ANGLES.map(angle => <option key={angle} value={angle}>{angle} frames</option>)}
                    </select>
                  </FormInput>
                )}

                <FormInput label="5. Efeitos Visuais" name="lighting">
                   <select id="lighting" name="lighting" value={formData.lighting} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {LIGHTING_STYLES.map(light => <option key={light}>{light}</option>)}
                    </select>
                    <div className="mt-2 flex items-center">
                        <input id="reflections" name="reflections" type="checkbox" checked={formData.reflections} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
                        <label htmlFor="reflections" className="ml-2 block text-sm text-gray-300">Adicionar reflexos</label>
                    </div>
                </FormInput>

                <FormInput label="6. Resolução" name="resolution">
                   <select id="resolution" name="resolution" value={formData.resolution} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {RESOLUTIONS.map(res => <option key={res}>{res}</option>)}
                    </select>
                </FormInput>

                <FormInput label="7. Marca d’Água (Opcional)" name="watermark">
                   <input type="text" name="watermark" id="watermark" value={formData.watermark} onChange={handleInputChange} placeholder="ex: SuaLoja.com" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </FormInput>
              </div>

              <div className="mt-8">
                <button type="submit" disabled={isLoading || !formData.productImage} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed">
                  <SparklesIcon className="w-5 h-5"/>
                  {isLoading ? 'Gerando...' : 'Gerar Mockup 3D'}
                </button>
              </div>
            </form>
          </aside>

          {/* Coluna do Resultado */}
          <section className="lg:col-span-3 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-center p-4 min-h-[400px] lg:min-h-[600px]">
            <div className="w-full h-full flex items-center justify-center">
                {isLoading ? (
                  <Loader progress={progress} totalFrames={formData.outputType === 'static' ? 1 : formData.rotationAngles} outputType={formData.outputType} />
                ) : error ? (
                  <div className="text-center text-red-400 bg-red-900/50 p-6 rounded-lg">
                    <h3 className="font-bold text-lg">Erro na Geração</h3>
                    <p className="mt-2 text-sm">{error}</p>
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div className="w-full max-w-2xl aspect-square">
                    <img
                        src={generatedImages[currentFrame]}
                        alt={`Visualização 3D - Frame ${currentFrame + 1}`}
                        className="w-full h-full object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <InfoIcon className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-xl font-semibold">Sua visualização 3D aparecerá aqui</h3>
                    <p className="mt-2 max-w-sm mx-auto">Preencha os campos ao lado, envie a imagem do seu produto e clique em "Gerar" para iniciar a mágica.</p>
                  </div>
                )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
