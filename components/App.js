import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';
import ReactDom from 'react-dom';
import styles from '../styles/App.module.css'

function Checkbox({toDoId, isChecked, handleIsChecked}) {
  return (
    <div 
      className={`${styles.checkbox} ${(isChecked ? styles.checked : "")}`} 
      onClick={() => {handleIsChecked(toDoId, !isChecked)}} />
  );
}

function Paragraph({isChecked, text, 
  updateToDoInToDosArray, updateToDoInDom}) {
  return (
    <div 
      className={`${styles.pg_block} ${(isChecked ? styles.checked : "")}`} 
      suppressHydrationWarning
      contentEditable="true" suppressContentEditableWarning={true} 
      placeholder="Add To-Do" 
      onInput={() => {updateToDoInToDosArray()}}
      onKeyDown={(e) => {updateToDoInDom(e)}}
    >
      {text}
    </div>
  );
}

function makeToDoObject(id, text, isChecked) {
  return {
    "objectType": "block", 
    "id": id, 
    "type": "to_do",
    "properties": {
      "text": text,
      "isChecked": isChecked
    }
  }
}

function ToDo({id, initIsChecked, text, 
  updateToDoInToDosArray, updateToDoInDom}) {
  let [isChecked, setIsChecked] = useState(initIsChecked);

  const handleIsChecked = (toDoId, isChecked) => {
    setIsChecked(isChecked);
    updateToDoInToDosArray(toDoId, isChecked);
  }

  return (
    <>
      <Checkbox toDoId={id} isChecked={isChecked} 
        handleIsChecked={handleIsChecked} />
      <Paragraph key={id} isChecked={isChecked}
        text={text} 
        updateToDoInToDosArray={updateToDoInToDosArray} 
        updateToDoInDom={updateToDoInDom} />
    </>
  );
}

function ToDoList({toDosArray, updateToDoInToDosArray, updateToDoInDom}) {
  return (
    toDosArray.map((to_do) => {
      return (
        <div key={to_do.id} id={to_do.id} className={styles.to_do_div}>
          <ToDo id={to_do.id}
            initIsChecked={to_do.properties.isChecked} 
            text={to_do.properties.text} 
            updateToDoInToDosArray={updateToDoInToDosArray} 
            updateToDoInDom={updateToDoInDom} />
        </div>
      );
    })
  );
}

export default function App() {
  // get to-dos from local storage
  const LS_TO_DO_KEY = "To-Dos";
  const localToDos = localStorage.getItem(LS_TO_DO_KEY);
  
  // initialize toDosArray with an empty to-do object
  const toDosArray = (localToDos) ? JSON.parse(localToDos) 
    : [makeToDoObject(uuidv4(), "", false)];

  /* initialize prevCaretPosInText, which 
     keeps track of where the caret has been */
  let prevCaretPosInText = 0;

  const resetPrevCaretPosInText = () => {
    // set prevCaretPosInText to proper position in text
    prevCaretPosInText = document.getSelection().baseOffset - 1;
  }

  useEffect(() => {
    // set prevCaretPosInText to caretPositionInText on click
    document.body.addEventListener('click', resetPrevCaretPosInText);

    // clean up the click listener after this effect
    return () => {
      window.removeEventListener("click", resetPrevCaretPosInText);
    }

    // line below fixes useEffect missing dependency warning:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateToDoInToDosArray = (toDoId=null, isChecked=null) => {
    if ((toDoId !== null) && 
      ((isChecked === true) || (isChecked === false))) {
      // if updateToDoInToDosArray is invoked from a Checkbox
      
      // (un)check the to-do with the passed in toDoId
      const toDoIndex = toDosArray.findIndex(x => x.id === toDoId);
      toDosArray[toDoIndex].properties.isChecked = isChecked;

    } else {
      // get current ToDo's Paragraph and text
      const currToDoPara = document.activeElement;
      const currToDoText = currToDoPara.innerText;

      // get current ToDo
      const currToDo = currToDoPara.parentNode;

      // get current ToDo id & current ToDo index (position) in toDosArray
      const currToDoId = currToDo.attributes.getNamedItem("id").value;
      const currToDoIndex = toDosArray.findIndex(x => x.id === currToDoId);

      // update current to-do text in toDosArray with currToDoText from DOM
      toDosArray[currToDoIndex].properties.text = currToDoText;
    }
    
    // update toDosArray in localStorage
    localStorage.setItem(LS_TO_DO_KEY, JSON.stringify(toDosArray));
    
    console.log('to-dos: '+ JSON.stringify(toDosArray));
  }

  const _setCaretPositionInText = (text, position) => {
    /* sets caret at position in text (TextNode) 
       or at start/end of other Node types */
    
    const textLength = text.length;
    
    // if text is not a TextNode
    if ((text.nodeType !== 3)) {
      console.log(`${text.nodeValue} is not a TextNode!`);
      position = 0;
    }
    
    // get range & selection for manipulating caret position
    let range = document.createRange();
    let selection = window.getSelection();

    // remove all ranges from the selection
    selection.removeAllRanges();

    // set start position of range in text
    if (position > textLength) {
      range.setStart(text, textLength);
    } else {
      range.setStart(text, position);
    }
    
    // place caret as a single point at range start
    range.collapse(true);

    // move the caret to position that the range specifies
    selection.addRange(range);
  }
  
  const updateToDoInDom = (e) => {

    /* GET CARET POSITION & CURRENT TO-DO ATTRIBUTES
     ======================================================================= */

    // get current ToDo, ToDo text, and text length
    const currToDoPara = document.activeElement;
    const currToDoText = currToDoPara.innerText;
    const currToDoLength = currToDoText.length;
    
    // get caret position in current ToDo
    const caretPositionInText = document.getSelection().baseOffset;

    // get current/previous/next ToDo
    const currToDo = currToDoPara.parentNode;
    const prevToDo = currToDo.previousSibling;
    const nextToDo = currToDo.nextSibling;

    // get current ToDo id & current ToDo index (position) in toDosArray
    const currToDoId = currToDo.attributes.getNamedItem("id").value;
    const currToDoIndex = toDosArray.findIndex(x => x.id === currToDoId);

    
    /* HELPER FUNCTIONS for HANDLING ENTER KEYDOWN
     ======================================================================= */

     const _insertEmptyNewToDo = (level, currToDoId, currToDoIndex) => {
      /* inserts empty to-do before/after current to-do in toDosArray 
         and inserts new ToDo object above/below current ToDo object in DOM */

      // set new to-do id and text
      const newToDoId = uuidv4();
      const newToDoText = "";

      // make level case-insensitive
      level = level.toUpperCase();

      // validate level at which new ToDo object should be inserted
      if ((level !== "ABOVE") && (level !== "BELOW")) {
        throw new Error(`_insertEmptyNewToDo level should be ` +
        `"ABOVE" or "BELOW", not "${level}"!`);
      }
      
      // determine level at which new ToDo object should be inserted
      const insertNewToDoAbove = (level === "ABOVE");
      
      // set new to-do index before/after current to-do index in toDosArray
      const newToDoIndex = (insertNewToDoAbove) ? 
        currToDoIndex : currToDoIndex + 1;

      // ~ insert new to-do before/after current to-do in toDosArray
      toDosArray.splice(newToDoIndex, 0, 
        makeToDoObject(newToDoId, newToDoText, false));
      
      // update toDosArray in localStorage
      localStorage.setItem(LS_TO_DO_KEY, JSON.stringify(toDosArray));

      // create new ToDo div to contain ToDo checkbox & ToDo Paragraph
      const newToDo = document.createElement('div');
      newToDo.classList.add(styles.to_do_div);
      
      // add id attribute to new ToDo div
      const newToDoIdAttr = document.createAttribute("id");
      newToDoIdAttr.value = newToDoId;
      newToDo.attributes.setNamedItem(newToDoIdAttr);

      // get current ToDo object
      const currToDo = document.getElementById(currToDoId);
      
      /* ~ insert new ToDo object above/below current ToDo object in DOM */
      ReactDom.render(
        <ToDo key={newToDoId} id={newToDoId} 
          text={newToDoText} 
          updateToDoInToDosArray={updateToDoInToDosArray} 
          updateToDoInDom={updateToDoInDom} />,
          (insertNewToDoAbove) ? 
            currToDo.parentNode.insertBefore(newToDo, currToDo) : 
            currToDo.parentNode.insertBefore(newToDo, currToDo.nextSibling)
      );

      // if new ToDo object is inserted below current ToDo object
      if (!insertNewToDoAbove) {
        // ~ focus on new ToDo Paragraph in DOM
        Array.from(newToDo.children).filter(
          x => x.classList?.contains(styles.pg_block))[0].focus(); 
      }

    }

    const _splitToDoAtCaret = (currToDoId, currToDoIndex) => {
      /* splits current ToDo text at caret; sets halves of split text 
         to current to-do and to new to-do in toDosArray respectively; 
         sets halves of split text to current ToDo's text 
         and to new ToDo's text in DOM respectively */
      
      // set new to-do id
      const newToDoId = uuidv4();

      // set new to-do index after current to-do index in toDosArray
      const newToDoIndex = currToDoIndex + 1;

      /* ~ split current ToDo text at caret 
         (into newCurrToDoText & newToDoText) */
      const newCurrToDoText = currToDoText.substring(0, 
          caretPositionInText);
      const newToDoText = currToDoText.substring(caretPositionInText);

      // ~ set current to-do text in toDosArray to 1st half of split text
      toDosArray[currToDoIndex].properties.text = newCurrToDoText;
      
      // update toDosArray in localStorage
      localStorage.setItem(LS_TO_DO_KEY, JSON.stringify(toDosArray));
      
      /* insert new to-do after current to-do in toDosArray and 
         ~ set new to-do text in toDosArray to 2nd half of split text */
      toDosArray.splice(newToDoIndex, 0, 
        makeToDoObject(newToDoId, newToDoText, false));
      
      // update toDosArray in localStorage
      localStorage.setItem(LS_TO_DO_KEY, JSON.stringify(toDosArray));

      // create new ToDo div to contain ToDo checkbox & ToDo Paragraph
      const newToDo = document.createElement('div');
      newToDo.classList.add(styles.to_do_div);
      
      // add id attribute to new ToDo div
      const newToDoIdAttr = document.createAttribute("id");
      newToDoIdAttr.value = newToDoId;
      newToDo.attributes.setNamedItem(newToDoIdAttr);

      // get current ToDo object
      const currToDo = document.getElementById(currToDoId);
      
      /* ~ set current ToDo's text in DOM to 1st half of split text */
      ReactDom.render(newCurrToDoText, currToDoPara, () => {
        if (currToDoPara.innerText !== newCurrToDoText) {
          currToDoPara.removeChild(currToDoPara.childNodes[0]); 
          currToDoPara.appendChild(
            document.createTextNode(new String(newCurrToDoText)))
        }
      });
      
      /* insert new ToDo object below current ToDo object in DOM and
         ~ set new ToDo's text in DOM to 2nd half of split text */
      ReactDom.render(
        <ToDo key={newToDoId} id={newToDoId} 
          text={newToDoText} 
          updateToDoInToDosArray={updateToDoInToDosArray} 
          updateToDoInDom={updateToDoInDom} />,
        currToDo.parentNode.insertBefore(newToDo, currToDo.nextSibling)
      );
      
      // ~ focus on new ToDo Paragraph in DOM
      Array.from(newToDo.children).filter(
        x => x.classList?.contains(styles.pg_block))[0].focus();

    }

    
    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES ENTER
     ======================================================================= */

    /**
     * Cases to handle when a user presses ENTER
     *
     * C1. ENTER at empty ToDo
     *   ~ insert new to-do after current to-do in toDosArray
     *   ~ insert new ToDo below current ToDo in DOM
     *   ~ focus on new ToDo's Paragraph in DOM
     * C2. ENTER at beginning of a ToDo with text
     *   ~ insert new to-do before current to-do in toDosArray
     *   ~ insert new ToDo above current ToDo in DOM
     * C3. ENTER at end of a ToDo with text
     *   ~ insert new to-do after current to-do in toDosArray
     *   ~ insert new ToDo below current ToDo in DOM
     *   ~ focus on new ToDo's Paragraph in DOM
     * C4. ENTER in the middle of a ToDo with text
     *   ~ split current ToDo text at caret
     *   ~ set current to-do text in toDosArray to 1st half of split text
     *   ~ set new to-do text in toDosArray to 2nd half of split text
     *   ~ set current ToDo's text in DOM to 1st half of split text
     *   ~ set new ToDo's text in DOM to 2nd half of split text
     *   ~ focus on new Paragraph in DOM
     */

    if (e.key === 'Enter') {
      
      e.preventDefault();
      
      if ((currToDoLength === 0) || 
        (caretPositionInText === currToDoLength)) {  
        // C1: ENTER at empty ToDo OR C3: ENTER at end of a ToDo with text
        _insertEmptyNewToDo("BELOW", currToDoId, currToDoIndex);

      } else if (caretPositionInText === 0) {  
        // C2: ENTER at beginning of a ToDo with text
        _insertEmptyNewToDo("ABOVE", currToDoId, currToDoIndex);

      } else { 
        // C4: ENTER in the middle of a ToDo with text
        _splitToDoAtCaret(currToDoId, currToDoIndex);
      }

      console.log('to-dos: ' + JSON.stringify(toDosArray));

    }


    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES BACKSPACE
     ======================================================================= */

    /**
     * Cases to handle when a user presses BACKSPACE
     *
     * C1. BACKSPACE at empty non-1st-ToDo 
     *   ~ remove current to-do from toDosArray
     *   ~ remove current ToDo from DOM
     *   ~ put caret at end of ToDo text above removed ToDo in DOM
     * C2. BACKSPACE at start of non-empty non-1st-ToDo
     *   ~ append current to-do text to to-do before it in toDosArray
     *   ~ remove current to-do from toDosArray
     *   ~ remove current ToDo from DOM
     *   ~ append removed ToDo's text to ToDo above it in DOM
     *   ~ put caret at join point in ToDo text above removed ToDo
     */

     if (e.key === 'Backspace') {

      // if current ToDo is not the first ToDo & caret is at start of ToDo text
      if ((prevToDo !== null) && (caretPositionInText === 0)) {

        e.preventDefault();

        // get previous ToDo Paragraph
        const prevToDoPara = (Array.from(prevToDo.childNodes)
          .filter(x => x.classList?.contains(styles.pg_block))[0]);
        
        if (prevToDoPara !== undefined) {

          // get previous ToDo text (div -> Paragraph -> text) and length
          const prevToDoText = prevToDoPara.innerText;
          const prevToDoTextLength = prevToDoText.length;
          
          // get previous ToDo text node (for setting caret position)
          const prevToDoTextNode = (prevToDoPara.childNodes[0] === undefined) ? 
            prevToDoPara : prevToDoPara.childNodes[0];

          // get previous ToDo id & previous ToDo index in toDosArray
          const prevToDoId = prevToDo.attributes.getNamedItem("id").value;
          const prevToDoIndex = toDosArray.findIndex(x => x.id === prevToDoId);
          
          if (currToDoLength === 0) {
            // C1: BACKSPACE at empty non-1st-ToDo

            // ~ remove current to-do from toDosArray
            toDosArray.splice(currToDoIndex, 1);
            
            // update toDosArray in localStorage
            localStorage.setItem(LS_TO_DO_KEY, JSON.stringify(toDosArray));

            // ~ remove current ToDo from DOM
            currToDo.parentNode.removeChild(currToDo);

            // ~ put caret at end of ToDo text above removed ToDo in DOM
            _setCaretPositionInText(prevToDoTextNode, prevToDoTextLength);

          } else {
            // C2: BACKSPACE at start of non-empty non-1st-ToDo

            // ~ append current to-do text to to-do before it in toDosArray
            const newPrevToDoText = prevToDoText + currToDoText;
            toDosArray[prevToDoIndex].properties.text = newPrevToDoText;
            
            // update toDosArray in localStorage
            localStorage.setItem(LS_TO_DO_KEY, JSON.stringify(toDosArray));
            
            // ~ remove current to-do from toDosArray
            toDosArray.splice(currToDoIndex, 1);
            
            // update toDosArray in localStorage
            localStorage.setItem(LS_TO_DO_KEY, JSON.stringify(toDosArray));

            // ~ remove current ToDo from DOM
            currToDo.parentNode.removeChild(currToDo);

            // ~ append removed ToDo's text to ToDo above it in DOM
            ReactDom.render(newPrevToDoText, prevToDoPara, () => {
              /* ~ put caret at join point in ToDo text above removed ToDo 
                 (since prevToDoTextLength != newPrevToDoText length) */
              /* can't access text node with prevToDoTextNode 
                 because of re-render */
              if (prevToDoPara.innerText !== newPrevToDoText) {
                prevToDoPara.removeChild(prevToDoPara.childNodes[0]); 
                prevToDoPara.appendChild(
                  document.createTextNode(new String(newPrevToDoText)));
              }
              _setCaretPositionInText(
                document.getElementById(prevToDoId).childNodes[0], 
                prevToDoTextLength);
            });

          }

          console.log('to-dos: ' + JSON.stringify(toDosArray));
        }

      }
    }


    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES LEFT ARROW KEY
     ======================================================================= */

    /**
     * Cases to handle when a user presses LEFT ARROW KEY
     *
     * C1. LEFT ARROW KEY at start of non-1st-ToDo
     *   ~ put caret at end of ToDo text above current ToDo in DOM
     */

    // if current ToDo is not the first ToDo & caret is at start of ToDo text 
    if ((e.key === 'ArrowLeft') && (prevToDo !== null) 
      && (caretPositionInText === 0)) {
      
      e.preventDefault();
      
      // get previous ToDo Paragraph
      const prevToDoPara = (Array.from(prevToDo.childNodes)
          .filter(x => x.classList?.contains(styles.pg_block))[0]);
      
      if (prevToDoPara !== undefined) {
        // get previous ToDo text and length
        const prevToDoText = prevToDoPara.innerText;
        const prevToDoTextLength = prevToDoText.length;
        
        // get previous ToDo text node (for setting caret position)
        const prevToDoTextNode = (prevToDoPara.childNodes[0] === undefined) ? 
          prevToDoPara : prevToDoPara.childNodes[0];

        // ~ put caret at end of ToDo text above current ToDo in DOM
        _setCaretPositionInText(prevToDoTextNode, prevToDoTextLength);

      }
      
    }


    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES RIGHT ARROW KEY
     ======================================================================= */

    /**
     * Cases to handle when a user presses RIGHT ARROW KEY
     *
     * C1. RIGHT ARROW KEY at end of non-last-ToDo
     *   ~ put caret at start of ToDo text below current ToDo in DOM
     */

    // if current ToDo is not the first ToDo & caret is at start of ToDo text 
    if ((e.key === 'ArrowRight') && (nextToDo !== null) 
      && (caretPositionInText === currToDoLength)) {
      
      e.preventDefault();
      
      // get next ToDo Paragraph
      const nextToDoPara = (Array.from(nextToDo.childNodes)
      .filter(x => x.classList?.contains(styles.pg_block))[0]);
      
      // get next ToDo text node (for setting caret position)
      const nextToDoTextNode = (nextToDoPara.childNodes[0] === undefined) ? 
        nextToDoPara : nextToDoPara.childNodes[0];

      // ~ put caret at start of ToDo text below current ToDo in DOM
      _setCaretPositionInText(nextToDoTextNode, 0);

    }

    if ((e.key !== 'ArrowUp') && (e.key !== 'ArrowDown')) {
      // set prevCaretPosInText to caretPositionInText on non-arrow-key press
      resetPrevCaretPosInText();
    }


    /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES UP ARROW KEY
     ======================================================================= */

    /**
     * Cases to handle when a user presses UP ARROW KEY
     *
     * C1. UP ARROW KEY at non-1st-ToDo
     *   ~ put caret at proper position in ToDo text above current ToDo
     *   ~ retain caretPosition value even if ToDo text above has less text
     */

    // if current ToDo is not the first ToDo
    if ((e.key === 'ArrowUp') && (prevToDo !== null)) {
      
      // get previous ToDo Paragraph
      const prevToDoPara = (Array.from(prevToDo.childNodes)
          .filter(x => x.classList?.contains(styles.pg_block))[0]);
      
      if (prevToDoPara !== undefined) {
        // if prevToDoPara is undefined, default will put caret at text start
        e.preventDefault();

        // get previous ToDo text node (for setting caret position)
        const prevToDoTextNode = (prevToDoPara.childNodes[0] === undefined) ? 
          prevToDoPara : prevToDoPara.childNodes[0];
        
        /* ~ retain caretPosition value even if ToDo text above has less text (so
            if you're at a ToDo with 4 chars, & you press UP to a ToDo with 2
            chars & UP again to a ToDo with 5 chars, your caret position on 
            the topmost ToDo will be at 4 chars instead of at 2) */
        prevCaretPosInText = (prevCaretPosInText > caretPositionInText) ?
          prevCaretPosInText : caretPositionInText;

        // ~ put caret at proper position in ToDo text above current ToDo
        _setCaretPositionInText(prevToDoTextNode, prevCaretPosInText);
      } else {
        // set prevCaretPosInText to text start if prevToDoPara is undefined
        prevCaretPosInText = 0;
      }
      
    }


   /* CASES TO HANDLE (preventDefault) WHEN A USER PRESSES DOWN ARROW KEY
     ======================================================================= */

    /**
     * Cases to handle when a user presses DOWN ARROW KEY
     *
     * C1. DOWN ARROW KEY at non-last-ToDo
     *   ~ put caret at proper position in ToDo text below current ToDo
     *   ~ retain caretPosition value even if ToDo text below has less text
     */

    // if current ToDo is not the last ToDo
    if ((e.key === 'ArrowDown') && (nextToDo !== null)) {
    
      e.preventDefault();
     
      // get next ToDo, ToDo text (div -> Paragraph -> text) and length
      const nextToDoPara = (Array.from(nextToDo.childNodes)
      .filter(x => x.classList?.contains(styles.pg_block))[0]);
     
      // get next ToDo text node (for setting caret position)
      const nextToDoTextNode = (nextToDoPara.childNodes[0] === undefined) ? 
        nextToDoPara : nextToDoPara.childNodes[0];
      
      /* ~ retain caretPosition value even if ToDo text below has less text */
      prevCaretPosInText = (prevCaretPosInText > caretPositionInText) ?
        prevCaretPosInText : caretPositionInText;

      // ~ put caret at proper position in ToDo text below current ToDo
      _setCaretPositionInText(nextToDoTextNode, prevCaretPosInText);

    }

  }


  const pageTitle = localStorage.getItem("pageTitle");

  return (
    <div className="container">
      <div contentEditable="true" className={styles.page_title} 
        suppressContentEditableWarning={true}
        placeholder="Untitled"
        onInput={(e) => {localStorage.setItem("pageTitle", 
          e.currentTarget.innerText)}}
      >
        {(pageTitle) ? pageTitle 
          : (((pageTitle === "")) ? "" : "Today's To-Dos")}
      </div>
      <ToDoList toDosArray={toDosArray} 
        updateToDoInToDosArray={updateToDoInToDosArray} 
        updateToDoInDom={updateToDoInDom} />
    </div>
  );
}
