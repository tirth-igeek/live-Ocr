import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 16,
  },
});

export default styles;
