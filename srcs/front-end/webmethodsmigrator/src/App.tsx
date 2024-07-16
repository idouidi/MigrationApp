// src/App.tsx

import React, { useState } from 'react';
import FormStep from './components/FormStep/FormStep';
import FormButtons from './components/FormStep/FormButton';
import FileUploader from './components/FormStep/FileUploader';
import PaternJson from './components/FormStep/PaternJson';
import './App.css';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isJsonSubmitted, setIsJsonSubmitted] = useState(false);

  const handleFileUpload = (success: boolean) => {
    setIsUploaded(success);
  };

  const handleJsonSubmit = (success: boolean) => {
    setIsJsonSubmitted(success);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    const step = steps.find(step => step.stepNumber === currentStep);
    if (step?.validator()) {
      setCurrentStep(currentStep + 1);
    } else {
      alert(step?.validationMessage);
    }
  };

  const steps = [
    {
      stepNumber: 1,
      description: 'Upload your file containing, list of trigger, documentfile, service, etc...',
      content: <FileUploader onFileUpload={handleFileUpload} />,
      validator: () => isUploaded,
      validationMessage: 'Please upload a file first.'
    },
    {
      stepNumber: 2,
      description: 'Enter your JSON pattern.',
      content: <PaternJson onJsonSubmit={handleJsonSubmit} />,
      validator: () => isJsonSubmitted,
      validationMessage: 'Please submit a valid JSON first.'
    }
  ];

  const currentStepConfig = steps.find(step => step.stepNumber === currentStep);

  return (
    <div className="App">
      <form className="form-container" onSubmit={(e) => e.preventDefault()}>
        {currentStepConfig && (
          <FormStep
            key={currentStepConfig.stepNumber}
            stepNumber={currentStepConfig.stepNumber}
            description={currentStepConfig.description}
          >
            {currentStepConfig.content}
          </FormStep>
        )}
        <FormButtons onPrevious={handlePrevious} onNext={handleNext} />
      </form>
    </div>
  );
};

export default App;
