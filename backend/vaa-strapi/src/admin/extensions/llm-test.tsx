import React, { useState } from 'react';
import { Box, Button, Typography } from '@strapi/design-system';

const LLMTest = () => {
  const [result, setResult] = useState<string | null>(null);

  const runTest = async () => {
    try {
      const response = await fetch('/api/llm-test/generate', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      console.error('Test failed:', error);
      setResult('Error: ' + error.message);
    }
  };

  return (
    <Box padding={4}>
      <Typography variant="alpha">LLM Test</Typography>

      <Button onClick={runTest}>Test LLM</Button>

      {result && (
        <Box marginTop={4}>
          <pre>{result}</pre>
        </Box>
      )}
    </Box>
  );
};

export default LLMTest;
