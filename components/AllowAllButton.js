import React from 'react';
import Button from './MasterKit/Button';

export default function AllowAllButton({ onAllow }) {
  return (
    <Button
      title="Allow All Tasks"
      onPress={onAllow}
      style={{ backgroundColor: '#4CAF50' }} // Green for approval
    />
  );
}
