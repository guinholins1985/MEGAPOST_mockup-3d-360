
import React from 'react';

interface LoaderProps {
  progress: number;
  totalFrames: number;
  outputType: 'static' | 'gif' | 'video';
}

const messages = [
  "Analisando a forma do produto...",
  "Estimando profundidade e textura...",
  "Renderizando ângulos de visão...",
  "Aplicando iluminação de estúdio...",
  "Polindo os detalhes finais...",
  "Compilando a visualização 360°...",
];

const Loader: React.FC<LoaderProps> = ({ progress, totalFrames, outputType }) => {
  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    const messageIndex = Math.min(
      Math.floor((progress / 100) * messages.length),
      messages.length - 1
    );
    setMessage(messages[messageIndex]);
  }, [progress]);
  
  const progressText = outputType === 'static' ? 'Gerando imagem 3D...' : `Gerando frame ${Math.ceil((progress / 100) * totalFrames)} de ${totalFrames}...`;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 rounded-lg p-8 text-center backdrop-blur-sm">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-700"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
          />
          <circle
            className="text-indigo-500 transition-all duration-300 ease-in-out"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={(2 * Math.PI * 40) * (1 - progress / 100)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
          {progress}%
        </span>
      </div>
      <p className="mt-6 text-lg font-semibold text-white">{progressText}</p>
      <p className="mt-2 text-sm text-gray-400">{message}</p>
    </div>
  );
};

export default Loader;
