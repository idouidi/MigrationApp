import React from 'react';
import '../css/Popup.css';

interface PopupProps {
  onClose: () => void;
  onValidate?: () => void; // Optionnel si la fonction de validation n'est pas toujours nécessaire
  children: React.ReactNode; // Utilise `children` pour rendre le contenu dynamique
}

const Popup: React.FC<PopupProps> = ({ onClose, onValidate, children }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="popup-close" onClick={onClose}>×</button>
        <div className="popup-body">
          {children} {/* Affiche le contenu passé en tant que children */}
        </div>
        <div className="popup-footer">
          {onValidate && <button className="popup-button" onClick={onValidate}>Valide</button>}
          <button className="popup-button" onClick={onClose}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
