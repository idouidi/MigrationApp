import React, { useState } from 'react';
import { useAxios } from '../../AxiosContext';

interface FileUploaderProps {
  onNext: () => void;
  onPrevious: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({onNext, onPrevious }) => {
  const [error, setError] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const axios = useAxios();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        setError(null);
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await axios.post("/uploads/entryData", formData);

          if (response.status === 201) {
            alert("File uploaded successfully!");
            setIsUploaded(true); // Update the state to enable the "Next Step" button
          } else {
            setError("Error uploading file. Please try again.");
            setIsUploaded(false); // Ensure that the "Next Step" button remains disabled
          }
        } catch (error) {
          setError("Error uploading file. Please try again.");
          setIsUploaded(false); // Ensure that the "Next Step" button remains disabled
        } finally {
          setIsUploading(false);
        }
      } else {
        setError("Please upload a valid .txt file.");
        setIsUploaded(false); // Ensure that the "Next Step" button remains disabled
      }
    }
  };

  return (
    <div className="file-uploader">
      <input 
        type="file" 
        accept=".txt" 
        onChange={handleFileChange} 
        disabled={isUploading} 
      />
      {error && <p className="error">{error}</p>}
      {isUploading && <p>Uploading...</p>}
      <div className="form-buttons">
        <button 
          type="button" 
          className="prev-button" 
          onClick={onPrevious} 
          disabled={isUploading}
        >
          Previous
        </button>
        <button 
          type="button" 
          className="next-button" 
          onClick={onNext} 
          disabled={!isUploaded || isUploading}
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
