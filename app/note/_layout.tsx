import { Stack } from 'expo-router';

export default function NoteLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal/[screenName]"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.25, 0.5, 0.9],
          sheetInitialDetentIndex: 1,
          sheetGrabberVisible: true,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
