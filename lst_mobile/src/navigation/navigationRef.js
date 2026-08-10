import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingDestination = null;

export const openPushDestination = data => {
  if (!data?.screen) return;
  const destination = { screen: data.screen, params: data.routeParams || undefined };
  if (!navigationRef.isReady()) {
    pendingDestination = destination;
    return;
  }
  navigationRef.navigate(destination.screen, destination.params);
};

export const flushPendingPush = () => {
  if (!pendingDestination || !navigationRef.isReady()) return;
  const destination = pendingDestination;
  pendingDestination = null;
  navigationRef.navigate(destination.screen, destination.params);
};
