import React, { useState } from 'react';
import { useAxios } from '../../AxiosContext';
import Popup from './Popup';
import DisplayPackagesTreeStructure from './DisplayPackagesTreeStructure ';

interface PaternJsonProps {
  onJsonSubmit: (success: boolean) => void;
}

const PaternJson: React.FC<PaternJsonProps> = ({ onJsonSubmit }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [jsonResult, setJsonResult] = useState<any | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const axios = useAxios();

  const handleJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(event.target.value);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      const json = JSON.parse(jsonInput);
      const response = await axios.post('/uploads/pattern', json);
      
      if (response.status === 201) {
        setJsonResult(response.data.jsonResult);
        setShowPopup(true);
        onJsonSubmit(true);
      } else {
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

  const handleValidate = async () => {
    try {
      // Envoyer la requête de validation ici
      await axios.post('/path/to/validation');
      alert('Validation successful!');
      setShowPopup(false);
    } catch (error) {
      alert('Error during validation.');
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
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
      {showPopup && (
        <Popup onClose={handleClosePopup} onValidate={handleValidate}>
          <DisplayPackagesTreeStructure data={jsonResult} />
        </Popup>
      )}
    </div>
  );
};

export default PaternJson;
