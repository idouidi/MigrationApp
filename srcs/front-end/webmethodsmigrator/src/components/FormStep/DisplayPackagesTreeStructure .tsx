import React, { useState } from 'react';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';

interface Service {
  oldName: string;
  newName: string;
}

interface ServicesRefactorDoc {
  targetpkg: string;
  services: Service[];
}

interface JarToCopy {
  oldPkg: string;
  newPkg: string;
  jarName: string;
}

interface DisplayPackagesTreeStructureProps {
  data: {
    servicesRefactorDocs: ServicesRefactorDoc[];
    jarsToCopy?: JarToCopy[];
  };
}

const DisplayPackagesTreeStructure: React.FC<DisplayPackagesTreeStructureProps> = ({ data }) => {
  const [openNodes, setOpenNodes] = useState<{ [key: string]: boolean }>({});

  const toggleNode = (nodeName: string) => {
    setOpenNodes((prevState) => ({
      ...prevState,
      [nodeName]: !prevState[nodeName],
    }));
  };

  const renderTree = (services: Service[]) => {
    const tree: { [key: string]: any } = {};

    services.forEach((service) => {
      const [path, finalPart] = service.newName.split(':');
      const parts = path.split('.');
      let current = tree;

      parts.forEach((part) => {
        if (!current[part]) current[part] = {};
        current = current[part];
      });

      if (!current['_final']) current['_final'] = [];
      current['_final'].push(finalPart);
    });

    const renderNode = (node: { [key: string]: any }, path: string[] = []) => {
      return Object.keys(node).map((key) => {
        const newPath = [...path, key];
        const nodePath = newPath.join('.');

        if (key === '_final') {
          return node[key].map((finalPart: string, index: number) => (
            <li key={index}>{finalPart}</li>
          ));
        }

        return (
          <li key={nodePath}>
            <div
              onClick={() => toggleNode(nodePath)}
              className="folder-icon"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {openNodes[nodePath] ? <FaFolderOpen /> : <FaFolder />}
              <span style={{ marginLeft: '5px' }}>{key}</span>
            </div>
            {openNodes[nodePath] && <ul>{renderNode(node[key], newPath)}</ul>}
          </li>
        );
      });
    };

    return <ul>{renderNode(tree)}</ul>;
  };

  return (
    <div>
      <h3>Services Refactor Docs</h3>
      <div className="scrollable-box">
        {data.servicesRefactorDocs.map((pkg) => (
          <div key={pkg.targetpkg}>
            <div
              onClick={() => toggleNode(pkg.targetpkg)}
              className="folder-icon"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {openNodes[pkg.targetpkg] ? <FaFolderOpen /> : <FaFolder />}
              <span style={{ marginLeft: '5px' }}>{pkg.targetpkg}</span>
            </div>
            {openNodes[pkg.targetpkg] && renderTree(pkg.services)}
          </div>
        ))}
      </div>
      {data.jarsToCopy && (
        <div>
          <h3>Jars to Copy</h3>
          <ul>
            {data.jarsToCopy.map((jar, index) => (
              <li key={index}>
                {jar.jarName} (Old: {jar.oldPkg}, New: {jar.newPkg})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DisplayPackagesTreeStructure;
