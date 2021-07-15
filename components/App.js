import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';
import ReactDom from 'react-dom';
import styles from '../styles/App.module.css'

function Checkbox({paragraphId, isChecked, handleIsChecked}) {
  return (
    <div className={`${styles.checkbox} ${(isChecked ? styles.checked : "")}`} 
      onClick={() => {handleIsChecked(paragraphId, !isChecked)}} />
  );
}

function Paragraph({id, text, updateLineInLines, updateLineInDom}) {
  return (
    <div id={id} className={styles.pg_block} suppressHydrationWarning
      contentEditable="true" suppressContentEditableWarning={true} 
      placeholder="Add To-Do" 
      onInput={() => {updateLineInLines()}}
      onKeyDown={(e) => {updateLineInDom(e)}}
    >
      {text}
    </div>
  );
}

function makeToDoObject(id, text, isChecked) {
  return {
    "objectType": "block", 
    "id": id, 
    "type": "text_line",
    "properties": {
      "text": text,
      "isChecked": isChecked
    }
  }
}

function ToDo({id, text, updateLineInLines, updateLineInDom}) {
  let [isChecked, setIsChecked] = useState(false);

  const handleIsChecked = (paragraphId, isChecked) => {
    setIsChecked(isChecked);
    updateLineInLines(paragraphId, isChecked);
  }

  return (
    <>
      <Checkbox paragraphId={id} isChecked={isChecked} handleIsChecked={handleIsChecked} />
      <Paragraph key={id} id={id} isChecked={isChecked}
        text={text} 
        updateLineInLines={updateLineInLines} 
        updateLineInDom={updateLineInDom} />
    </>
  );
}

export default function App() {
  // initialize Lines array with an empty line object
  const lines = [makeToDoObject(uuidv4(), "", false)];

  /* initialize prevCaretPosInLine, which 
     keeps track of where the caret has been */
  let prevCaretPosInLine = 0;

  const resetPrevCaretPosInLine = () => {
    // sets prevCaretPosInLine to proper position in line
    prevCaretPosInLine = document.getSelection().baseOffset - 1;
  }

  useEffect(() => {
    // set prevCaretPosInLine to caretPositionInLine on click
    document.body.addEventListener('click', resetPrevCaretPosInLine);

    // clean up the click listener after this effect
    return () => window.removeEventListener("click", resetPrevCaretPosInLine);

    // line below fixes useEffect missing dependency warning:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateLineInLines = (paragraphId=null, isChecked=null) => {
    if ((paragraphId !== null) && 
      ((isChecked === true) || (isChecked === false))) {
      // if updateLineInLines is invoked from a Checkbox
      
      // (un)check the paragraph with the passed in paragraphId
      const lineIndex = lines.findIndex(x => x.id === paragraphId);
      lines[lineIndex].properties.isChecked = isChecked;

    } else {
      // get currentLineText & currentLineIndex
      const currentLine = document.activeElement;
      const currentLineText = currentLine.innerText;
      const currentLineId = currentLine.attributes.getNamedItem("id").value;
      const currentLineIndex = lines.findIndex(x => x.id === currentLineId);

      // update current line text in Lines array with currentLineText from DOM
      lines[currentLineIndex].properties.text = currentLineText;
    }
    console.log('lines: '+ JSON.stringify(lines));
  }

  const _setCaretPositionInLine = (line, position) => {
    /* sets caret at position in line (TextNode) 
       or at start/end of line (with other Node types) */
    
    const lineLength = line.length;
    
    // if line is not a TextNode
    if ((line.nodeType !== 3)) {
      console.log(`${line.nodeValue} is not a TextNode!`);
      position = 0;
    }
    
    // get range & selection for manipulating caret position
    let range = document.createRange();
    let selection = window.getSelection();

    // remove all ranges from the selection
    selection.removeAllRanges();

    // set start position of range in line
    if (position > lineLength) {
      range.setStart(line, lineLength);
    } else {
      range.setStart(line, position);
    }
    
    // place caret as a single point at range start
    range.collapse(true);

    // move the caret to position that the range specifies
    selection.addRange(range);
  }
  
  const updateLineInDom = (e) => {

    /* GET CARET POSITION & CURRENT LINE ATTRIBUTES
     ======================================================================= */

    // get current line, line text, and line length
    const currentLine = document.activeElement;
    const currentLineText = currentLine.innerText;
    const currentLineLength = currentLineText.length;
    
    // get caret position in current line
    const caretPositionInLine = document.getSelection().baseOffset;

    // get current line id & current line index (position) in lines array
    const currentLineId = currentLine.attributes.getNamedItem("id").value;
    const currentLineIndex = lines.findIndex(x => x.id === currentLineId);

    // get current/previous/next Paragraphs' container divs
    const currParaDiv = document.getElementById(currentLineId).parentNode;
    const prevParaDiv = currParaDiv.previousSibling;
    const nextParaDiv = currParaDiv.nextSibling;

    
    /* HELPER FUNCTIONS for HANDLING ENTER KEYDOWN
     ======================================================================= */

     const _insertEmptyNewLine = (level, currentLineId, currentLineIndex) => {
      /* inserts empty line before/after current line in Lines array 
         and inserts new Paragraph above/below current Paragraph in DOM */

      // set new line id and text
      const newLineId = uuidv4();
      const newLineText = "";

      // make level case-insensitive
      level = level.toUpperCase();

      // validate level at which new Paragraph should be inserted
      if ((level !== "ABOVE") && (level !== "BELOW")) {
        throw new Error(`_insertEmptyNewLine level should be ` +
        `"ABOVE" or "BELOW", not "${level}"!`);
      }
      
      // determine level at which new Paragraph should be inserted
      const insertNewLineAbove = (level === "ABOVE");
      
      // set new line index before/after current line index in Lines array
      const newLineIndex = (insertNewLineAbove) ? 
        currentLineIndex : currentLineIndex + 1;

      // ~ insert new line before/after current line in Lines array
      lines.splice(newLineIndex, 0, makeToDoObject(newLineId, newLineText, false));

      // create container div to contain new Paragraph
      const div = document.createElement('div');

      // get current Paragraph's container div
      const currParaDiv = document.getElementById(currentLineId).parentNode;
      
      /* ~ insert new Paragraph (container) 
         above/below current Paragraph (container) in DOM */
      ReactDom.render(
        <>
        <Paragraph key={newLineId} id={newLineId} 
          text={newLineText} 
          updateLineInLines={updateLineInLines} 
          updateLineInDom={updateLineInDom} /> </>,
          (insertNewLineAbove) ? 
            currParaDiv.parentNode.insertBefore(div, currParaDiv) : 
            currParaDiv.parentNode.insertBefore(div, currParaDiv.nextSibling)
      );

      // if new Paragraph container is inserted below current Paragraph container
      if (!insertNewLineAbove) {
        // ~ focus on new Paragraph in DOM
        div.children[0].focus(); 
      }

    }

    const _splitLineAtCaret = (currentLineId, currentLineIndex) => {
      /* splits current line at caret; sets halves of split text 
         to current line and new line in Lines array respectively; 
         sets halves of split text to current Paragraph's text 
         and new Paragraph's text in DOM respectively */
      
      // set new line id
      const newLineId = uuidv4();

      // set new line index after current line index in Lines array
      const newLineIndex = currentLineIndex + 1;

      /* ~ split current line text at caret 
         (into newCurrentLineText & newLineText) */
      const newCurrentLineText = currentLineText.substring(0, 
          caretPositionInLine);
      const newLineText = currentLineText.substring(caretPositionInLine);

      // ~ set current line text in Lines array to 1st half of split text
      lines[currentLineIndex].properties.text = newCurrentLineText;
      
      /* insert new line after current line in Lines array and 
         ~ set new line text in Lines array to 2nd half of split text */
      lines.splice(newLineIndex, 0, makeToDoObject(newLineId, newLineText, false));

      // create container div to contain new Paragraph
      const div = document.createElement('div');

      // get current Paragraph's container div
      const currParaDiv = document.getElementById(currentLineId).parentNode;
      
      /* ~ set current Paragraph's text in DOM to 1st half of split text */
      ReactDom.render(newCurrentLineText, currentLine, () => {
        if (currentLine.innerText !== newCurrentLineText) {
          currentLine.removeChild(currentLine.childNodes[0]); 
          currentLine.appendChild(document.createTextNode(new String(newCurrentLineText)))
        }
      });
      
      /* insert new Paragraph (container) below 
         current Paragraph (container) in DOM and
         ~ set new Paragraph's text in DOM to 2nd half of split text */
      ReactDom.render(
        <Paragraph key={newLineId} id={newLineId} 
          text={newLineText} 
          updateLineInLines={updateLineInLines} 
          updateLineInDom={updateLineInDom} />,
        currParaDiv.parentNode.insertBefore(div, currParaDiv.nextSibling)
      );
      
      // ~ focus on new Paragraph in DOM
      div.children[0].focus();

    }

    
    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES ENTER
     ======================================================================= */

    /**
     * Cases to handle when a user presses ENTER
     *
     * C1. ENTER on an empty line
     *   ~ insert new line after current line in Lines array
     *   ~ insert new Paragraph below current Paragraph in DOM
     *   ~ focus on new Paragraph in DOM
     * C2. ENTER at beginning of a line with text
     *   ~ insert new line before current line in Lines array
     *   ~ insert new Paragraph above current Paragraph in DOM
     * C3. ENTER at end of a line with text
     *   ~ insert new line after current line in Lines array
     *   ~ insert new Paragraph below current Paragraph in DOM
     *   ~ focus on new Paragraph in DOM
     * C4. ENTER in the middle of a line with text
     *   ~ split current line text at caret
     *   ~ set current line text in Lines array to 1st half of split text
     *   ~ set new line text in Lines array to 2nd half of split text
     *   ~ set current Paragraph's text in DOM to 1st half of split text
     *   ~ set new Paragraph's text in DOM to 2nd half of split text
     *   ~ focus on new Paragraph in DOM
     */

    if (e.key === 'Enter') {
      
      e.preventDefault();
      
      if ((currentLineLength === 0) || 
        (caretPositionInLine === currentLineLength)) {  
        // C1: ENTER on an empty line OR C3: ENTER at end of a line with text
        _insertEmptyNewLine("BELOW", currentLineId, currentLineIndex);

      } else if (caretPositionInLine === 0) {  
        // C2: ENTER at beginning of a line with text
        _insertEmptyNewLine("ABOVE", currentLineId, currentLineIndex);

      } else { 
        // C4: ENTER in the middle of a line with text
        _splitLineAtCaret(currentLineId, currentLineIndex);
      }

      console.log('lines: ' + JSON.stringify(lines));

    }


    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES BACKSPACE
     ======================================================================= */

    /**
     * Cases to handle when a user presses BACKSPACE
     *
     * C1. BACKSPACE on a non-1st-Paragraph empty line 
     *   ~ remove current line from Lines array
     *   ~ remove current Paragraph from DOM
     *   ~ put caret at end of Paragraph above removed Paragraph in DOM
     * C2. BACKSPACE at start of a non-1st-Paragraph line with text 
     *   ~ append current line text to line before it in Lines array
     *   ~ remove current line from Lines array
     *   ~ remove current Paragraph from DOM
     *   ~ append removed Paragraph's text to Paragraph above it in DOM
     *   ~ put caret at join point in Paragraph above removed Paragraph
     */

     if (e.key === 'Backspace') {

      // if current line is not the first line & caret is at line start
      if ((prevParaDiv !== null) && (caretPositionInLine === 0)) {

        e.preventDefault();

        // get previous line
        const prevLine = prevParaDiv.childNodes[0];
        
        if (prevLine !== undefined) {

          // get previous line text (div -> Paragraph -> text) and length
          const prevLineText = prevLine.innerText;
          const prevLineLength = prevLineText.length;
          
          // get previous line text node (for setting caret position)
          const prevLineTextNode = (prevLine.childNodes[0] === undefined) ? 
            prevLine : prevLine.childNodes[0];

          // get previous line id & previous line index (position) in lines array
          const prevLineId = prevLine.attributes.getNamedItem("id").value;
          const prevLineIndex = lines.findIndex(x => x.id === prevLineId);
          
          if (currentLineLength === 0) {
            // C1: BACKSPACE on a non-1st-Paragraph empty line

            // ~ remove current line from Lines array
            lines.splice(currentLineIndex, 1);

            // ~ remove current Paragraph from DOM
            currParaDiv.parentNode.removeChild(currParaDiv);

            // ~ put caret at end of Paragraph above removed Paragraph in DOM
            _setCaretPositionInLine(prevLineTextNode, prevLineLength);

          } else {
            // C2: BACKSPACE at start of a non-1st-Paragraph line with text

            // ~ append current line text to line before it in Lines array
            const newPrevLineText = prevLineText + currentLineText;
            lines[prevLineIndex].properties.text = newPrevLineText;
            
            // ~ remove current line from Lines array
            lines.splice(currentLineIndex, 1);

            // ~ remove current Paragraph from DOM
            currParaDiv.parentNode.removeChild(currParaDiv);

            // ~ append removed Paragraph's text to Paragraph above it in DOM
            ReactDom.render(newPrevLineText, prevLine, () => {
              /* ~ put caret at join point in Paragraph above removed Paragraph 
                   (since prevLineLength != newPrevLineText length) */
              // can't use prevLineTextNode to access text node because of re-render
              if (prevLine.innerText !== newPrevLineText) {
                prevLine.removeChild(prevLine.childNodes[0]); 
                prevLine.appendChild(document.createTextNode(new String(newPrevLineText)))
              }
              _setCaretPositionInLine(document.getElementById(prevLineId).childNodes[0], prevLineLength)
            });

          }

          console.log('lines: ' + JSON.stringify(lines));
        }

      }
    }


    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES LEFT ARROW KEY
     ======================================================================= */

    /**
     * Cases to handle when a user presses LEFT ARROW KEY
     *
     * C1. LEFT ARROW KEY at start of a non-1st-Paragraph line
     *   ~ put caret at end of Paragraph above current Paragraph in DOM
     */

    // if current line is not the first line & caret is at line start 
    if ((e.key === 'ArrowLeft') && (prevParaDiv !== null) 
      && (caretPositionInLine === 0)) {
      
      e.preventDefault();
      
      // get previous line, line text (div -> Paragraph -> text) and length
      const prevLine = prevParaDiv.childNodes[0];
      
      if (prevLine !== undefined) {
        const prevLineText = prevLine.innerText;
        const prevLineLength = prevLineText.length;
        
        // get previous line text node (for setting caret position)
        const prevLineTextNode = (prevLine.childNodes[0] === undefined) ? 
          prevLine : prevLine.childNodes[0];

        // ~ put caret at end of Paragraph above current Paragraph in DOM
        _setCaretPositionInLine(prevLineTextNode, prevLineLength);

      }
      
    }


    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES RIGHT ARROW KEY
     ======================================================================= */

    /**
     * Cases to handle when a user presses RIGHT ARROW KEY
     *
     * C1. RIGHT ARROW KEY at end of a non-last-line line
     *   ~ put caret at start of Paragraph below current Paragraph in DOM
     */

    // if current line is not the first line & caret is at line start 
    if ((e.key === 'ArrowRight') && (nextParaDiv !== null) 
      && (caretPositionInLine === currentLineLength)) {
      
      e.preventDefault();
      
      // get next line, line text (div -> Paragraph -> text) and length
      const nextLine = nextParaDiv.childNodes[0];
      
      // get next line text node (for setting caret position)
      const nextLineTextNode = (nextLine.childNodes[0] === undefined) ? 
        nextLine : nextLine.childNodes[0];

      // ~ put caret at start of Paragraph below current Paragraph in DOM
      _setCaretPositionInLine(nextLineTextNode, 0);

    }

    if ((e.key !== 'ArrowUp') && (e.key !== 'ArrowDown')) {
      // set prevCaretPosInLine to caretPositionInLine on non-arrow-key press
      resetPrevCaretPosInLine();
    }


    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES UP ARROW KEY
     ======================================================================= */

    /**
     * Cases to handle when a user presses UP ARROW KEY
     *
     * C1. UP ARROW KEY on non-1st-Paragraph line
     *   ~ put caret at proper position in Paragraph above current Paragraph
     *   ~ retain caretPosition value even if line above has less text
     */

    // if current line is not the first line
    if ((e.key === 'ArrowUp') && (prevParaDiv !== null)) {
      
      // get previous line, line text (div -> Paragraph -> text) and length
      const prevLine = prevParaDiv.childNodes[0];
      
      if (prevLine !== undefined) {
        // if prevLine is undefined, default will put caret at line start
        e.preventDefault();

        // get previous line text node (for setting caret position)
        const prevLineTextNode = (prevLine.childNodes[0] === undefined) ? 
          prevLine : prevLine.childNodes[0];
        
        /* ~ retain caretPosition value even if line above has less text (so
            if you're on a line with 4 chars, & you press UP to a line with 2
            chars & UP again to a line with 5 chars, your caret position on 
            the topmost line will be at 4 chars instead of at 2) */
        prevCaretPosInLine = (prevCaretPosInLine > caretPositionInLine) ?
          prevCaretPosInLine : caretPositionInLine;

        // ~ put caret at proper position in Paragraph above current Paragraph
        _setCaretPositionInLine(prevLineTextNode, prevCaretPosInLine);
      } else {
        // set prevCaretPosInLine to line start if prevLine is undefined
        prevCaretPosInLine = 0;
      }
      
    }


   /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES DOWN ARROW KEY
     ======================================================================= */

    /**
     * Cases to handle when a user presses DOWN ARROW KEY
     *
     * C1. DOWN ARROW KEY on non-last-line line
     *   ~ put caret at proper position in Paragraph below current Paragraph
     *   ~ retain caretPosition value even if line below has less text
     */

    // if current line is not the last line
    if ((e.key === 'ArrowDown') && (nextParaDiv !== null)) {
    
      e.preventDefault();
     
      // get next line, line text (div -> Paragraph -> text) and length
      const nextLine = nextParaDiv.childNodes[0];
     
      // get next line text node (for setting caret position)
      const nextLineTextNode = (nextLine.childNodes[0] === undefined) ? 
        nextLine : nextLine.childNodes[0];
      
      /* ~ retain caretPosition value even if line below has less text */
      prevCaretPosInLine = (prevCaretPosInLine > caretPositionInLine) ?
        prevCaretPosInLine : caretPositionInLine;

      // ~ put caret at proper position in Paragraph below current Paragraph
      _setCaretPositionInLine(nextLineTextNode, prevCaretPosInLine);

    }

  }


  return (
    <>
      <ToDo id={"testId"} text={"testText"} updateLineInLines={updateLineInLines} 
        updateLineInDom={updateLineInDom} />
      {
        lines.map((line) => {
          return (
            <div key={line.id}>
              <ToDo id={line.id} text={line.text} 
                updateLineInLines={updateLineInLines} 
                updateLineInDom={updateLineInDom} />
            </div>
          );
        })
      }
    </>
  );
}
