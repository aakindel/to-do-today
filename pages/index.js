import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useState } from 'react';
import { DarkModeSwitch } from '../components/darkModeToggle';
const App = dynamic(() => import('../components/App'), {
  ssr: false
})

const DarkModeToggle = () => {
  const [isDarkMode, setDarkMode] = useState(false);

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
    (checked) ? document.documentElement.classList.add('dark-mode') 
      : document.documentElement.classList.remove('dark-mode')
  };

  return (
    <DarkModeSwitch
      checked={isDarkMode}
      onChange={toggleDarkMode}
    />
  );
};

export default function Home() {
  return (
    <>
      <Head>
        <title>Today&apos;s Todos</title>
        <meta name="description" 
          content="Write down and get done your tasks for today!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="container dmt-nav">
        <DarkModeToggle />
      </nav>

      <div className="spacer"></div>

      <App />
    </>
  )
}
