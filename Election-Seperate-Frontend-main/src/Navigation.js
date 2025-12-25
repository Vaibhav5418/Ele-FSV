// src/components/Navigation.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button } from '@chakra-ui/react';

function Navigation() {
  return (
    <Box>
      <Link to="/dashboard">
        <Button variant="link">Dashboard</Button>
      </Link>
      <Link to="/analytics">
        <Button variant="link">Analytics</Button>
      </Link>
      {/* Add more navigation links */}
    </Box>
  );
}

export default Navigation;
