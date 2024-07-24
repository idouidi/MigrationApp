import React, { useEffect, useState } from 'react';
import { useAxios } from '../../AxiosContext';

interface FileDownloaderProps {
  onPrevious: () => void; // Ajoutez cette ligne pour la prop onPrevious
}

const FileDownloader: React.FC<FileDownloaderProps> = ({ onPrevious }) => {
  const [zipPath, setZipPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // État pour gérer le chargement
  const axios = useAxios();

 
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Début du chargement
      try {
        const response = await axios.post('/uploads/pattern/validate', null, {
          responseType: 'blob', // Assurez-vous que la réponse est traitée comme un blob
        });

        if (response.status === 201) { // Utilisez 200 pour une réponse réussie
          // Créez un URL pour le fichier ZIP
          const fileURL = URL.createObjectURL(new Blob([response.data]));
          setZipPath(fileURL); // Stockez l'URL du fichier ZIP
          setError(null); // Réinitialiser les erreurs en cas de succès
        } else {
          setError('Confirmation failed. Please try again.');
          setZipPath(null);
        }
      } catch (error) {
        console.error('Error confirming:', error);
        setError('Error confirming. Please try again later.');
        setZipPath(null);
      } finally {
        setIsLoading(false); // Fin du chargement
      }
    };

    fetchData();
  }, [axios]);

  const handleDownload = () => {
    if (zipPath) {
      // Crée un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = zipPath;
      link.download = 'download.zip'; // Nom du fichier ZIP
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No file available for download.');
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>} {/* Affiche un message de chargement */}
      {error && <p className="error">{error}</p>}
      {zipPath && !error && !isLoading && (
        <button onClick={handleDownload}>Download ZIP File</button>
      )}
      <div className="form-buttons">
        <button type="button" className="prev-button" onClick={onPrevious}>
          Previous
        </button>
      </div>
    </div>
  );
};

export default FileDownloader;
