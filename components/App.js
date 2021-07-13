import { v4 as uuidv4 } from 'uuid';

export default function App() {
  // initialize Lines array with an empty line object
  const lines = [{id: uuidv4(), text: ""}];
  console.log(lines);

  return (
    <div suppressHydrationWarning>
      {JSON.stringify(lines)}
    </div>
  );
}
