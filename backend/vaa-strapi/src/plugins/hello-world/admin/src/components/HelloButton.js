import React, { useState } from 'react';
import { Box, Button, Typography } from '@strapi/design-system';
import { request } from '@strapi/helper-plugin';

const HelloButton = () => {
  const [response, setResponse] = useState(null);

  const handleClick = async () => {
    try {
      const result = await request('/api/hello-world/hello', {
        method: 'GET'
      });
      console.log('API Response:', result);
      setResponse(result.message);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Box padding={4}>
      <Button onClick={handleClick}>Say Hello</Button>
      {response && (
        <Box marginTop={4}>
          <Typography>{response}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default HelloButton;
