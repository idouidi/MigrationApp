import React, { useState } from 'react';
import FormStep from './components/FormStep/FormStep';
import FileUploader from './components/FormStep/FileUploader';
import PaternJson from './components/FormStep/PaternJson';
import './App.css';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(2);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isJsonSubmitted, setIsJsonSubmitted] = useState(false);

  const handleFileUpload = (success: boolean) => {
    setIsUploaded(success);
    if (success) {
      moveToNextStep();  // Move to next step after successful upload
    }
  };

  const handleJsonSubmit = (success: boolean) => {
    setIsJsonSubmitted(success);
    if (success) {
      moveToNextStep();  // Move to next step after successful JSON submission
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const moveToNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const steps = [
    {
      stepNumber: 1,
      description: 'Upload your file containing, list of trigger, documentfile, service, etc...',
      content: (
        <FileUploader
          isUploaded={isUploaded}  // Pass the isUploaded state
          onFileUpload={handleFileUpload}
          onPrevious={handlePrevious}
        />
      ),
      validator: () => isUploaded,
      validationMessage: 'Please upload a file first.'
    },
    {
      stepNumber: 2,
      description: 'Enter your JSON pattern.',
      content: (
        <PaternJson
          onJsonSubmit={handleJsonSubmit}
          onPrevious={handlePrevious}
          onNext={moveToNextStep}
        />
      ),
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
      </form>
    </div>
  );
};

export default App;
