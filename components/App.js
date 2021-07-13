import { v4 as uuidv4 } from 'uuid';
import styles from '../styles/App.module.css'

function Paragraph({id, text, updateLineInLines}) {
  return (
    <div id={id} className={styles.pg_block} suppressHydrationWarning
      contentEditable="true" suppressContentEditableWarning={true} 
      placeholder="Add To-Do" 
      onInput={() => {updateLineInLines()}}
    >
      {text}
    </div>
  );
}

export default function App() {
  // initialize Lines array with an empty line object
  const lines = [{id: uuidv4(), text: ""}];
  console.log(lines);

  const updateLineInLines = () => {
    // get currentLineText & currentLineIndex
    const currentLine = document.activeElement;
    const currentLineText = currentLine.innerText;
    const currentLineId = currentLine.attributes.getNamedItem("id").value;
    const currentLineIndex = lines.findIndex(x => x.id === currentLineId);

    // update current line text in Lines array with currentLineText from DOM
    lines[currentLineIndex].text = currentLineText;
    console.log('lines: '+ JSON.stringify(lines));
  }

  return (
    lines.map((line) => {
      return <div key={line.id}><Paragraph id={line.id} text={line.text} updateLineInLines={updateLineInLines} /></div>
    })
  );
}
