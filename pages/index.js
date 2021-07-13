import Head from 'next/head'
import App from '../components/App'

export default function Home() {
  return (
    <>
      <Head>
        <title>Today's Todos</title>
        <meta name="description" 
          content="Write down and get done your tasks for today!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <App />
    </>
  )
}
