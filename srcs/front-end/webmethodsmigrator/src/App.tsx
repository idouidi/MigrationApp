// src/App.tsx

import React, { useState } from 'react';
import './App.css';
import FormStep from './components/FormStep';
import FormButtons from './components/FormButtons';

const App: React.FC = () => {
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileUpload = (success: boolean) => {
    setIsUploaded(success);
  };

  const handlePrevious = () => {
    // Logic for previous step
    console.log("Previous step clicked");
  };

  const handleNext = () => {
    if (isUploaded) {
      alert("Proceeding to next step");
      // Navigate to the next step
    } else {
      alert("Please upload a file first.");
    }
  };

  return (
    <div className="App">
      <form className="form-container" onSubmit={(e) => e.preventDefault()}>
        <FormStep
          stepNumber={1}
          description="Upload your file containing, list of trigger, documentfile, service, etc..."
          onFileUpload={handleFileUpload}
        />
        <FormButtons onPrevious={handlePrevious} onNext={handleNext} />
      </form>
    </div>
  );
};

export default App;
