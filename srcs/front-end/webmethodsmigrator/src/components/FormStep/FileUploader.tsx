import React, { useState } from 'react';
import { useAxios } from '../../AxiosContext';

interface FileUploaderProps {
  isUploaded: boolean; // Add this line
  onFileUpload: (success: boolean) => void;
  onPrevious: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ isUploaded, onFileUpload, onPrevious }) => {
  const [error, setError] = useState<string | null>(null);
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
            onFileUpload(true);
            alert("File uploaded successfully!");
          } else {
            setError("Error uploading file. Please try again.");
            onFileUpload(false);
          }
        } catch (error) {
          setError("Error uploading file. Please try again.");
          onFileUpload(false);
        } finally {
          setIsUploading(false);
        }
      } else {
        setError("Please upload a valid .txt file.");
      }
    }
  };

  return (
    <div className="file-uploader">
      <input type="file" accept=".txt" onChange={handleFileChange} disabled={isUploading} />
      {error && <p className="error">{error}</p>}
      {isUploading && <p>Uploading...</p>}
      <div className="form-buttons">
        <button type="button" className="prev-button" onClick={onPrevious} disabled={isUploading}>Previous</button>
        <button type="button" className="next-button" disabled={!isUploaded || isUploading}>Next Step</button>
      </div>
    </div>
  );
};

export default FileUploader;
