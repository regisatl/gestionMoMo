import React from 'react';
import { View } from 'react-native';
import Loader from '../components/ui/Loader';

const LoadingScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <Loader 
        message="loader.session"
        fullscreen={true}
      />
    </View>
  );
};

export default LoadingScreen;