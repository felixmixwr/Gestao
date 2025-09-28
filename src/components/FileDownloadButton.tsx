import React from 'react';
import { Button } from './Button';

interface FileDownloadButtonProps {
  /** Caminho do arquivo no storage ou null se não disponível */
  path: string | null;
  /** Texto do botão */
  label: string;
  /** Tipo de arquivo para ícone */
  fileType?: 'xlsx' | 'pdf';
  /** Função callback opcional */
  onClick?: () => void;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente para download de arquivos
 * Por enquanto mocka URLs até o backend estar pronto
 */
export const FileDownloadButton: React.FC<FileDownloadButtonProps> = ({
  path,
  label,
  fileType = 'pdf',
  onClick,
  className = ''
}) => {
  const isDisabled = path === null;
  
  const handleClick = () => {
    if (isDisabled) return;
    
    if (onClick) {
      onClick();
    } else {
      // Por enquanto, mocka o download
      // TODO: Implementar download real quando backend estiver pronto
      console.log(`Download mockado: ${path}`);
      window.open('#', '_blank');
    }
  };

  const getIcon = () => {
    if (fileType === 'xlsx') {
      return (
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" clipRule="evenodd" />
          <path d="M7 7h6v2H7V7zm0 4h6v2H7v-2z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" clipRule="evenodd" />
        <path d="M7 7h6v2H7V7zm0 4h6v2H7v-2z" />
      </svg>
    );
  };

  return (
    <Button
      variant={isDisabled ? 'secondary' : 'primary'}
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex items-center ${className}`}
      title={isDisabled ? 'Arquivo não disponível' : `Baixar ${label}`}
    >
      {getIcon()}
      {label}
    </Button>
  );
};
