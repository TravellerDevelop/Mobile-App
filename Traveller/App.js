import React from 'react';
import Font from './components/font';
import Navigator from './routes/NotificationStack';
import Loading from './shared/loading';

export default function App() {
  let fontLoaded = Font();

  if (!fontLoaded) {
    return (
      <Loading />
    )
  } else {
    return (
      Navigator()
    )
  }
}
