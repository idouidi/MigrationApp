import React, { useState } from 'react';
import { useAxios } from '../../AxiosContext';
import Popup from './Popup';
import DisplayPackagesTreeStructure from './DisplayPackagesTreeStructure ';

interface PaternJsonProps {
  onJsonSubmit: (success: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const PaternJson: React.FC<PaternJsonProps> = ({ onJsonSubmit, onPrevious, onNext }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [jsonResult, setJsonResult] = useState<any | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const axios = useAxios();

  const handleJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(event.target.value);
    setError(null); // Réinitialiser l'erreur lorsque l'entrée change
  };

  const handleSubmit = async () => {
    try {
      const json = JSON.parse(jsonInput);
      const response = await axios.post('/uploads/pattern', json);

      if (response.status === 201) {
        console.log('JSON submitted successfully');
        setJsonResult(response.data.jsonResult);
        setIsPopupVisible(true); // Ouvrir le popup
      } else {
        console.log('Error submitting JSON:', response.status);
        setError('Error submitting JSON. Please try again later.');
        onJsonSubmit(false);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format.');
      } else {
        setError('Error submitting JSON. Please try again later.');
      }
      onJsonSubmit(false);
    }
  };

  const handleConfirm = async () => {
    try {
      console.log('Confirm button clicked');
      const confirmResponse = await axios.post('/uploads/pattern/validate'); // Remplacez par l'URL de validation appropriée
      if (confirmResponse.status === 201) {
        console.log('Confirmation successful');
        onJsonSubmit(true);
        onNext(); // Passer à l'étape suivante seulement après confirmation
      } else {
        alert('Confirmation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error confirming:', error);
      alert('Error confirming. Please try again later.');
    } finally {
      setIsPopupVisible(false); // Ferme le popup après confirmation ou erreur
    }
  };

  const handlePopupClose = () => {
    setIsPopupVisible(false);
  };

  return (
    <div>
      <textarea
        value={jsonInput}
        onChange={handleJsonChange}
        rows={10}
        cols={50}
        placeholder="Enter your JSON here..."
      />
      {error && <p className="error">{error}</p>}
      <button onClick={handleSubmit}>Submit JSON</button>
      {isPopupVisible && (
        <Popup
          onClose={handlePopupClose} // Fermer le popup sans passer à l'étape suivante
          onValidate={handleConfirm} // Passer à l'étape suivante si la confirmation est réussie
        >
          <DisplayPackagesTreeStructure data={jsonResult} />
        </Popup>
      )}
      <div className="form-buttons">
        <button type="button" className="prev-button" onClick={onPrevious}>Previous</button>
      </div>
    </div>
  );
};

export default PaternJson;
