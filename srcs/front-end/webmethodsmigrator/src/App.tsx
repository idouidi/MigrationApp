import React, { useState } from 'react';
import FormStep from './components/FormStep/FormStep';
import FileUploader from './components/FormStep/FileUploader';
import PaternJson from './components/FormStep/PaternJson';
import './App.css';
import FileDownloader from './components/FormStep/FileDownloader';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
 
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const moveToNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const steps = [
    {
      stepNumber: 1,
      description: 'Upload your file containing, list of trigger, documentfile, service, etc...',
      content: (
        <FileUploader
          onPrevious={handlePrevious}
          onNext={moveToNextStep}
        />
      ),
      validationMessage: 'Please upload a file first.'
    },
    {
      stepNumber: 2,
      description: 'Enter your JSON pattern.',
      content: (
        <PaternJson
          onPrevious={handlePrevious}
          onNext={moveToNextStep}
        />
      ),
      validationMessage: 'Please submit a valid JSON first.'
    },
    {
      stepNumber: 3,
      description: 'Review your JSON pattern.',
      content: (
        <FileDownloader
          onPrevious={handlePrevious}
        />
      ),
      validationMessage: 'Please review your JSON first.'
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
