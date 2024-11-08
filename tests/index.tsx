import '@mantine/core/styles.layer.css';
import "@clinicaltoolkits/universal-react-components/dist/styles/global.css";
import '@mantine/tiptap/styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TestContextWrapper } from './AppTest';

const rootElement = document.getElementById("root");

if (!rootElement) {
  // Throw an error if the root element is not found
  throw new Error("Failed to find the root element");
} else {
  // Check if the root element already has child nodes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hydrate = rootElement.hasChildNodes();

  // Create a root instance for rendering
  const container = createRoot(rootElement);

  // Render the App component inside the container
  container.render(<TestContextWrapper />);
}