import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react';
import { DarkModeSwitch } from '../components/darkModeToggle';
const App = dynamic(() => import('../components/App'), {
  ssr: false
})

const DarkModeToggle = ({initialChecked}) => {
  const [isDarkMode, setDarkMode] = useState(initialChecked);

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
    
    // add or remove dark-mode based on whether the toggle is (un)checked
    (checked) ? document.documentElement.classList.add('dark-mode') 
      : document.documentElement.classList.remove('dark-mode');
    
    // on the server, do not try to set the theme in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("theme", (checked) ? "dark" : "light");
    }
  };

  return (
    <DarkModeSwitch
      checked={isDarkMode}
      onChange={toggleDarkMode}
    />
  );
};

export default function Home() {

  // on the server, do not try to get the theme from localStorage
  const localTheme = (typeof window !== 'undefined') 
    ? localStorage.getItem("theme") : null
  
  // set the initial theme based on the localStorage theme
  if (localTheme === "dark") { 
    document.documentElement.classList.add('dark-mode');
  } else if (localTheme === "light") {
     document.documentElement.classList.remove('dark-mode');
  }

  useEffect(() => {
    const dmt = document.getElementById("dmt_nav")

    const hideVisibility = () => { dmt.style.opacity = "0"; }
    const showVisibility = () => { dmt.style.opacity = "1"; }

    // show nav on mouse move and hide it on key down
    document.body.addEventListener('mousemove', showVisibility);
    document.body.addEventListener('keydown', hideVisibility);

    // clean up listeners after this effect
    return () => {
      window.removeEventListener('mousemove', showVisibility);
      window.removeEventListener('keydown', hideVisibility);
    }

    // line below fixes useEffect missing dependency warning:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Head>
        <title>Today&apos;s Todos</title>
        <meta name="description" 
          content="Write down and get done your tasks for today!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="container dmt-nav" id="dmt_nav">
        <DarkModeToggle initialChecked={(localTheme === "dark") ? true : false}/>
      </nav>

      <div className="spacer"></div>

      <App />
    </>
  )
}
