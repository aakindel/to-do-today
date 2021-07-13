import { v4 as uuidv4 } from 'uuid';
import styles from '../styles/App.module.css'

function Paragraph({id, text}) {
  return (
    <div id={id} className={styles.pg_block} suppressHydrationWarning
      contentEditable="true" suppressContentEditableWarning={true} 
      placeholder="Add To-Do" 
    >
      {text}
    </div>
  );
}

export default function App() {
  // initialize Lines array with an empty line object
  const lines = [{id: uuidv4(), text: ""}];
  console.log(lines);

  return (
    lines.map((line) => {
      return <Paragraph key={line.id} id={line.id} text={line.text} />
    })
  );
}
