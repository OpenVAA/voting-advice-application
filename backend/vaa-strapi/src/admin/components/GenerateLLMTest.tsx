import React from 'react';
import { Button } from '@strapi/design-system';
import { request } from '@strapi/helper-plugin';

const GenerateLLMTest = () => {
  const handleClick = async () => {
    try {
      const response = await request('/api/llm-test/generate', {
        method: 'POST'
      });
      // Refresh the list view
      window.location.reload();
    } catch (error) {
      console.error('Failed to generate test:', error);
    }
  };

  return <Button onClick={handleClick}>Generate New Test</Button>;
};

export default GenerateLLMTest;
