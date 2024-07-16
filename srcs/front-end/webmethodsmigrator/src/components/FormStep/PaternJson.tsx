import React, { useState } from 'react';
import { useAxios } from '../../AxiosContext';

interface PaternJsonProps {
  onJsonSubmit: (success: boolean) => void;
}

const PaternJson: React.FC<PaternJsonProps> = ({ onJsonSubmit }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const axios = useAxios();

  const handleJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(event.target.value);
    setError(null); // Reset error when input changes
  };

  const handleSubmit = async () => {
    try {
      const json = JSON.parse(jsonInput);
      await axios.post('/pattern', json);
      onJsonSubmit(true);
      alert('JSON submitted successfully!');
    } catch (error) {
      if (error instanceof SyntaxError) {
      } else {
        setError('Error submitting JSON. Please try again later.');
      }
      onJsonSubmit(false);
    }
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
    </div>
  );
};

export default PaternJson;
