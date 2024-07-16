// src/components/FormButtons.tsx

import React from 'react';
import '../css/FormButtons.css';

interface FormButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
}

const FormButtons: React.FC<FormButtonsProps> = ({ onPrevious, onNext }) => {
  return (
    <div className="form-buttons">
      <button type="button" className="prev-button" onClick={onPrevious}>Previous</button>
      <button type="button" className="next-button" onClick={onNext}>Next Step</button>
    </div>
  );
};

export default FormButtons;
