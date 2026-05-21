import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { NavigationProvider } from './src/navigation';
import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/store';
import mobileAds from 'react-native-google-mobile-ads';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize Google Mobile Ads SDK
    mobileAds()
      .setRequestConfiguration({
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : undefined,
      })
      .then(() => mobileAds().initialize())
      .then(() => console.log('Mobile Ads SDK initialized'))
      .catch((error) => console.error('Mobile Ads SDK init error:', error));
  }, []);

  return (
    <Provider store={store}>
      <NavigationProvider>
        <AppNavigator />
      </NavigationProvider>
    </Provider>
  );
}

export default App;
