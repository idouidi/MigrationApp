import React, { ReactNode } from 'react';
import '../css/FormStep.css';

interface FormStepProps {
  stepNumber: number;
  description: string;
  children: ReactNode; // Permet de recevoir n'importe quel composant comme enfant
}

const FormStep: React.FC<FormStepProps> = ({ stepNumber, description, children }) => {
  return (
    <div className="form-step">
      <div className="form-header">
        <h2>STEP {stepNumber}</h2>
        <p>{description}</p>
      </div>
      <div className="upload-container">
        {children} {/* Affiche le composant enfant passé en paramètre */}
      </div>
    </div>
  );
};

export default FormStep;
