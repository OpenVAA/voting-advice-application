import React from 'react';
import { Box, Button } from '@strapi/design-system';

const HelloButton = () => {
  const handleClick = () => {
    console.log('Hello from plugin button!');
  };

  return (
    <Box padding={4}>
      <Button onClick={handleClick}>Say Hello</Button>
    </Box>
  );
};

export default HelloButton;
