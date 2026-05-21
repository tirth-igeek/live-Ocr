declare module 'react-native-vector-icons/MaterialIcons' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import React from 'react';

  export default class MaterialIcons extends React.Component<IconProps> {}
}

declare module 'react-native-vector-icons/Icon' {
  import React from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
    onPress?: () => void;
    activeOpacity?: number;
  }

  export default class Icon extends React.Component<IconProps> {}
}
