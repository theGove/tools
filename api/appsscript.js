
class ssa {
  getActiveSpreadsheet() {
    return new ss();
  }
}

class ss {
  getSheetByName(sheetName) {
    return new s(sheetName);
  }
}

class s{
    constructor(name) {
        this.name = name;
    }
    getName(){
        return this.name
    }
    getRange(a,b,c,d){
        return new r(this.name,a,b,c,d)
    }
}

class r{
    constructor(tableName, a, b, c=1, d=1) {
        this.tableName = tableName;
        if(isNaN(a)){
            // address format
            if(a.includes(":")){
                const parts = a.split(":")
                this.startAddress = parts[0]
                this.endAddress = parts[1]
            }else{
                this.startAddress = a
                this.endAddress = a
            }
            let startCellInfo = parseCellRef(this.startAddress)
            let endCellInfo = parseCellRef(this.endAddress)

            this.startRow = startCellInfo.row
            this.startColumn = startCellInfo.col
            this.endRow = endCellInfo.row
            this.endColumn = endCellInfo.col
            this.rows = this.endRow - this.startRow + 1
            this.columns = this.endColumn - this.startColumn + 1
        }else{
            this.startRow = a
            this.startColumn = b
            this.rows = c
            this.columns = d
            this.endRow = this.startRow + this.rows - 1
            this.endColumn = this.startColumn + this.columns - 1
            this.startAddress = columnLabel(this.startColumn)+this.startRow
            this.endAddress = columnLabel(this.endColumn)+this.endRow
        }
        if(this.startAddress === this.endAddress){
           this.address = this.startAddress 
        }else{
           this.address = this.startAddress + ":" + this.endAddress
        }
        
    }
    getA1Notation(){
        return this.address
    }

    getValues(){
        const table = tag(this.tableName.toLowerCase()) 
        const data=[]
        for(let r=this.startRow;r<=this.endRow;r++){
            const row=[]
            for(let c=this.startColumn;c<=this.endColumn;c++){
                const text = table.rows[r].cells[c].textContent
                if(isNaN(text)){
                    row.push(text)
                }else{
                    row.push(parseFloat(text))
                }
                
            }
            data.push(row)
        }
        return data;
    }

    getValue(){
       return(this.getValues()[0][0]    )
    }

    setValues(values){
        // need to check that the values fit in the range
        if (Array.isArray(values)) {
            // check that all elements are arrays and have the correct length
            if (values.every(row => Array.isArray(row) && row.length === this.columns) && values.length === this.rows) {
                // values are valid, proceed with setting them
            } else {
                throw new Error(`setValues expects an array of arrays with dimensions ${this.rows}x${this.columns}`)
            }

        }else{
            throw new Error("setValues expects an array of arrays")
        }
        // write the values out
        for(let r=this.startRow;r<=this.endRow;r++){
            for(let c=this.startColumn;c<=this.endColumn;c++){
                const cell = tag(`${this.tableName.toLowerCase()}-${columnLabel(c)}${r}`)       
                const value = values[r-this.startRow][c-this.startColumn]
                
                cell.textContent = value        
                if(isNaN(value)){
                    if(value.startsWith("=")){
                        updateCellValue(cell)
                    }
                    
                    cell.style.textAlign="left"
                }else{
                    cell.style.textAlign="right"
                }

            }
        }
        refreshFormulas(this.tableName.toLowerCase())        
    }

    setValue(value){
        this.setValues([[value]])
    }




    
    setFontWeight(fontWeight){
        for(let r=this.startRow;r<=this.endRow;r++){
            for(let c=this.startColumn;c<=this.endColumn;c++){
                const cell = tag(`${this.tableName.toLowerCase()}-${columnLabel(c)}${r}`)       
                cell.style.fontWeight = fontWeight;        
            }   
        }
    }

    setFontColor(color){
        for(let r=this.startRow;r<=this.endRow;r++){
            for(let c=this.startColumn;c<=this.endColumn;c++){
                const cell = tag(`${this.tableName.toLowerCase()}-${columnLabel(c)}${r}`)       
                cell.style.color = color;        
            }
        }   
    }
    
    setBackground(color){
        for(let r=this.startRow;r<=this.endRow;r++){
            for(let c=this.startColumn;c<=this.endColumn;c++){
                const cell = tag(`${this.tableName.toLowerCase()}-${columnLabel(c)}${r}`)       
                cell.style.backgroundColor = color;        
            }
        }   
    }

}


const SpreadsheetApp = new ssa();

tag = (id) => document.getElementById(id)

function addStyles(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

function columnLabel(n) {
  let label = '';

  while (n > 0) {
    n--;                              // shift to 0-indexed
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }

  return label;
}

function columnNumber(label) {
  let n = 0;

  for (let i = 0; i < label.length; i++) {
    n *= 26;
    n += label.toUpperCase().charCodeAt(i) - 64;
  }

  return n;
}

function parseCellRef(ref) {
  const match = ref.match(/^([A-Za-z]+)(\d+)$/);

  if (!match) throw new Error(`Invalid cell reference: "${ref}"`);

  const label = match[1].toUpperCase();
  const row   = parseInt(match[2], 10);
  const col   = columnNumber(label);

  return { row, col, label };
}

function insertTableAfter(element, spreadsheet) {
   
    sheetName=spreadsheet.sheetName
    data= Array.from({ length: spreadsheet.rows }, () => Array(spreadsheet.columns).fill(""));
    
  if (!element || !Array.isArray(data) || data.length === 0) return;

  // //build out the data array
  // for(let r=0;r<spreadsheet.rows;r++){
  //   if(!data[r]) data[r]=[]
  //   for(let c=0;c<spreadsheet.columns;c++){
  //       if(!data[r][c]) data[r][c]=""
  //   }
  // }

  const table = document.createElement('table');
  table.className="spreadsheet-table"


  // add Column Headers
  const headerRow = []
  for(let x=0;x<data[0].length;x++){
    headerRow.push(columnLabel(x+1))
  }
  data.unshift(headerRow)

  // add Row Numbers
   data[0].unshift("");
  for (let i = 1; i < data.length; i++) {
    data[i].unshift(i);
  }


for (let row = 0; row < data.length; row++) {
  const tr = document.createElement('tr');

  for (let col = 0; col < data[row].length; col++) {
    let cellType= row === 0 || col === 0 ? 'th' : 'td'
    const cell = document.createElement(cellType);
    // if(typeof data[row][col] === "string" && data[row][col].startsWith("=")){
    //     cell.dataset.formula = data[row][col];
    // }else{
         cell.textContent = data[row][col];
    // }
    cell.id=`${sheetName.toLowerCase()}-${columnLabel(col)}${row}`
    if(cellType==="td"){
        cell.contentEditable = "true";
        // if(!isNaN(cell.textContent)){
        //     cell.style.textAlign="right"
        // }
    }
    
    cell.addEventListener('blur', (e) => {
            recordCellValue(e.target)
    })

    tr.appendChild(cell);
  }

  table.appendChild(tr);
}
  // add the table name
  let tr = document.createElement('tr');
  let cell = document.createElement("td");
  cell.colSpan = data[0].length;
  cell.style.padding=0;
  cell.style.border="none";
  const div = document.createElement("div");
  div.className="spreadsheet-name"
  div.style.fontWeight = "bold";
  div.style.textAlign = "center";
  div.textContent = sheetName;
  cell.appendChild(div);
  tr.appendChild(cell);
  table.appendChild(tr);
  table.id = sheetName.toLowerCase();


  // add the example
  tr = document.createElement('tr');
  tr.id=`${sheetName.toLowerCase()}-example`
  cell = document.createElement("td");
  cell.colSpan = data[0].length;
  cell.style.padding="10px";
  cell.style.border="none"
  cell.style.fontStyle="italic"
  const preTag = document.createElement("pre")
    preTag.textContent = `function buildExample(){
      const example = ${JSON.stringify(spreadsheet, null, 2)}
      // prepare sheet
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(example.sheetName);

      if (sheet) {
        sheet.clearContents();
        sheet.clearFormats();
      } else {
        sheet = ss.insertSheet(example.sheetName);
      }      
      // add data      
      for(const values of example.data){
        const range = sheet.getRange(values.range)
        range.setValues(values.values)
      }

      // apply formats
      for(const format of example.formats){
        const range = sheet.getRange(format.range)
        if(format.fontWeight){
            range.setFontWeight(format.fontWeight)
        }   
        if(format.fontColor){
            range.setFontColor(format.fontColor)
        }       
        if(format.background){
            range.setBackground(format.background)
        }   
      }

      // fit columns to data
      sheet.autoResizeColumns(1, sheet.getLastColumn());


    }`
  cell.appendChild(preTag);
  tr.style.display="none"
  tr.appendChild(cell);
  table.appendChild(tr);
  

  // add the message cell
  tr = document.createElement('tr');
  cell = document.createElement("td");
  cell.colSpan = data[0].length;
  cell.style.padding="10px";
  cell.style.border="none";
  cell.style.color="white"
  cell.style.backgroundColor="red"

  tr.id = `${sheetName.toLowerCase()}-message`
  tr.style.display="none"
  tr.appendChild(cell);
  table.appendChild(tr);
  table.style.marginBottom="1rem"
  

    table.addEventListener('focus', (e) => {
    const cell = e.target;    
    if (cell.matches('td, th')) {
        if(cell.dataset.formula){
            cell.textContent = cell.dataset.formula
        }   

    }
    }, true);


  // copy button in top-left corner — prompts user to choose what to copy
  const copyCornerBtn = document.createElement("button")
  copyCornerBtn.title = "Copy…"
  copyCornerBtn.style.cssText = "cursor:pointer;padding:1px 5px;border:1px solid #bbb;border-radius:3px;background:#fff;display:block;margin:auto;line-height:1;"
  const copyCornerIcon = document.createElement("span")
  copyCornerIcon.className = "material-symbols-outlined"
  copyCornerIcon.textContent = "content_copy"
  copyCornerBtn.appendChild(copyCornerIcon)
  copyCornerBtn.addEventListener("click", () => {
      message({
          title: "Copy",
          text: "What would you like to copy?",
          buttons: [
              {text: "Code to build sheet", fn: (evt) => {
                  navigator.clipboard.writeText(preTag.textContent)
                  closeMessage(evt)
                  message({title:"Paste the code", seconds:10, type:"info",
                      text:"Open <a href='https://script.google.com' target='_blank'>Google Apps Script</a>, paste the code into the editor, and click <strong>Run</strong>. The script will create the sheet and populate it with the example data."})
              }},
              {text: "Data for existing sheet", fn: (evt) => {
                  copyTableForSheets(sheetName)
                  closeMessage(evt)
                  message({title:"Paste into Google Sheets", seconds:10, type:"info",
                      text:"Open your Google Sheet, click the cell where you want the top-left corner of the data, then press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong> on Mac) to paste."})
              }}
          ]
      })
  })
  table.querySelector('th').appendChild(copyCornerBtn)

  element.insertAdjacentElement('afterend', table);
  refreshFormulas(table.id)

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  // add data
  for(const values of spreadsheet.data){
    const range = sheet.getRange(values.range)
    range.setValues(values.values)
  }

  // apply formats
  for(const format of spreadsheet.formats){
    const range = sheet.getRange(format.range)
    if(format.fontWeight){
        range.setFontWeight(format.fontWeight)
    }   
    if(format.fontColor){
        range.setFontColor(format.fontColor)
    }       
    if(format.background){
        range.setBackground(format.background)
    }   
  }

  return table;
}
 function recordCellValue(cell){
    const newValue = cell.innerText;

    if (cell.dataset.formula && !newValue.startsWith("=")) {
        // User edited a formula cell and replaced it with a non-formula value
        delete cell.dataset.formula;
    }

    updateCellValue(cell)
 }
 function updateCellValue(cell, skipRefresh = false){
    let updatedValue = cell.innerText;
    // When called programmatically (e.g. refreshFormulas), innerText may be empty
    // while the formula is already stored in data-formula
    if (!updatedValue.startsWith("=") && cell.dataset.formula)
        updatedValue = cell.dataset.formula;

    if(updatedValue.startsWith("=")){
        try{
        updatedValue = updatedValue.replace(/[A-Za-z]+(?=\d)/g, (m) => m.toUpperCase());
        cell.dataset.formula = updatedValue;
        updatedValue = evaluateFormula(updatedValue, cell.id.split("-")[0])
        cell.textContent = updatedValue;
        }catch(e){
            showFormulaError(cell.id.split("-")[0], e.message);
        }

    }else{
        cell.removeAttribute('data-formula');
        console.log("just removed formula for", cell.id)
    }
    if(isNaN(updatedValue)){
        cell.style.textAlign="left"
    }else{
        cell.style.textAlign="right"
    }
    // Add your save logic or API call here
    if (!skipRefresh) refreshFormulas(cell.id.split("-")[0])
}

function initSheet(table){
      spreadsheet=JSON.parse(table.innerText)
      if(spreadsheet.label){
        let url = `/feeds/posts/default/-/${spreadsheet.label}?alt=json`
        if(["localhost","127.0.0.1"].includes(window.location.hostname)){
            //we are running locally, so use a different url
            url="feeds/"+spreadsheet.label+".json"
        }
        console.log(url)
        fetch(url)
        .then(response => {
            // Check if the HTTP status code is successful (200-299)
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // Parses the response stream into a JSON object
        })
        .then(data => {
            console.log("data",data)
            const spreadsheet = JSON.parse(data.feed.entry[0].content.$t)
            console.log('Success:', spreadsheet); // Handle your data here
            insertTableAfter(table, spreadsheet)
        });        
      }else{
        insertTableAfter(table, spreadsheet)
      }

      table.style.display="none"
}
function initSheets(){
    for (const table of document.querySelectorAll("pre.spreadsheet")){
      initSheet(table)
    }
    addStyles(`
        .spreadsheet-table {
        border-collapse: collapse;
        
        }
        .spreadsheet-table th, 
        .spreadsheet-table td {
        border: 1px solid #ccc;
        padding: 8px 12px;
        text-align: left;
        }

        .spreadsheet-table th {
          background-color: #f4f4f4;
          font-weight: bold;
          text-align: center;
        }
        div.spreadsheet-name {
          background-color: #f4f4f4;
          display: inline-block;
          padding: 4px 8px;
          border-radius: 0 0 6px 6px;
          border: 1px solid #ccc;
          margin-left:1rem;
        }  
    `);
}


// formula parsing and evaluation ===============================

// Iterates cells described by a comma-separated arg list, calling cb(textContent) for each non-empty cell
function iterateCells(args, tableId, cb) {
  for (const arg of args.split(',')) {
    const part = arg.trim();
    if (part.includes(':')) {
      const [startRef, endRef] = part.split(':');
      const start = parseCellRef(startRef.trim());
      const end   = parseCellRef(endRef.trim());
      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const cell = tag(`${tableId.toLowerCase()}-${columnLabel(col)}${row}`);
          if (cell && cell.textContent.trim() !== '') cb(cell.textContent.trim());
        }
      }
    } else {
      const cell = tag(`${tableId.toLowerCase()}-${part.toUpperCase()}`);
      if (cell && cell.textContent.trim() !== '') cb(cell.textContent.trim());
    }
  }
}

function collectValues(args, tableId) {
  const values = [];
  iterateCells(args, tableId, (text) => {
    const val = parseFloat(text);
    if (!isNaN(val)) values.push(val);
  });
  return values;
}

function collectAllValues(args, tableId) {
  const values = [];
  iterateCells(args, tableId, (text) => values.push(text));
  return values;
}

// Add new spreadsheet functions here — each receives (nums: number[], all: string[]) and returns a number
const sheetFunctions = {
  SUM:     (nums)      => nums.reduce((a, b) => a + b, 0),
  COUNT:   (nums)      => nums.length,
  AVERAGE: (nums)      => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0,
  MIN:     (nums)      => Math.min(...nums),
  MAX:     (nums)      => Math.max(...nums),
  COUNTA:  (nums, all) => all.length,
};

function evaluateFormula(formula, tableId) {
  hideFormulaError(tableId)
  // Strip leading '='
  const expression = formula.startsWith('=') ? formula.slice(1) : formula;

  // Replace known function calls with their computed value before cell-ref substitution
  const fnPattern = new RegExp(`(${Object.keys(sheetFunctions).join('|')})\\(([^)]+)\\)`, 'gi');
  const withFunctions = expression.replace(fnPattern, (_, name, args) => {
    const fn = sheetFunctions[name.toUpperCase()];
    return fn(collectValues(args, tableId), collectAllValues(args, tableId));
  });

  // Replace remaining cell references with their values
  const resolved = withFunctions.replace(/[A-Za-z]+\d+/g, (ref) => {
    const key = ref.toUpperCase();
    const oneCell = tag(`${tableId.toLowerCase()}-${key}`);
    if (!oneCell) throw new Error(`Unknown cell reference: ${ref}`);
    return oneCell.textContent || "0";
  });

  // Validate — only allow numbers, operators, parens, spaces, decimals
  if (!/^[\d\s+\-*/().]+$/.test(resolved)) {
    const tr=tag(`${tableId.toLowerCase()}-message`)
    const cell = tr.querySelector("td");
    tr.style.display=""
    cell.textContent = `Unsupported formula: ${resolved}`
    throw new Error(`Unsupported formula: ${resolved}`);

  }

  return parse(resolved.replace(/\s+/g, ''));
}

// Returns the Set of cell element IDs referenced by a formula (expands ranges to individual cells)
function extractCellRefs(formula, tableId) {
  const refs = new Set();
  const expression = formula.startsWith('=') ? formula.slice(1) : formula;
  const prefix = tableId.toLowerCase() + '-';

  // Expand range references (e.g. A1:B3) into individual cell IDs
  const rangeRe = /([A-Za-z]+\d+):([A-Za-z]+\d+)/g;
  let m;
  while ((m = rangeRe.exec(expression)) !== null) {
    const start = parseCellRef(m[1]);
    const end   = parseCellRef(m[2]);
    for (let row = start.row; row <= end.row; row++)
      for (let col = start.col; col <= end.col; col++)
        refs.add(prefix + columnLabel(col) + row);
  }

  // Collect remaining individual cell references (letters followed by digits)
  const stripped = expression.replace(/[A-Za-z]+\d+:[A-Za-z]+\d+/g, '');
  const cellRe = /[A-Za-z]+\d+/g;
  while ((m = cellRe.exec(stripped)) !== null)
    refs.add(prefix + m[0].toUpperCase());

  return refs;
}

function showFormulaError(tableId, message){
    const tr=tag(`${tableId.toLowerCase()}-message`)
    const cell = tr.querySelector("td");
    tr.style.display=""
    cell.textContent = message
}

function hideFormulaError(tableId){
    const tr=tag(`${tableId.toLowerCase()}-message`)
    const cell = tr.querySelector("td");
    tr.style.display="none"
    cell.textContent = ""
}
        
// Recalculates all formula cells in a table in dependency order (topological sort)
function refreshFormulas(tableId) {
    hideFormulaError(tableId)
    try{
        refreshFormulae(tableId)
    }  catch(e){
       showFormulaError(tableId, e.message)        
    }
}

function refreshFormulae(tableId) {
    
    const tr=tag(`${tableId.toLowerCase()}-message`)
    

    const table = tag(tableId.toLowerCase());
    if (!table) return;

    const formulaCells = [...table.querySelectorAll('td[data-formula]')];
    if (formulaCells.length === 0) return;

    const cellSet = new Set(formulaCells.map(c => c.id));
    const deps  = {};  // deps[id]  = Set of formula-cell ids this cell depends on
    const rdeps = {};  // rdeps[id] = Set of formula-cell ids that depend on this cell

    for (const cell of formulaCells) {
        deps[cell.id]  = new Set();
        rdeps[cell.id] = rdeps[cell.id] || new Set();
    }

    for (const cell of formulaCells) {
        for (const ref of extractCellRefs(cell.dataset.formula, tableId)) {
        if (cellSet.has(ref)) {
            deps[cell.id].add(ref);
            if (!rdeps[ref]) rdeps[ref] = new Set();
            rdeps[ref].add(cell.id);
        }
        }
    }

    // Kahn's algorithm: process cells with no unresolved dependencies first
    const inDegree = Object.fromEntries(formulaCells.map(c => [c.id, deps[c.id].size]));
    const queue    = formulaCells.filter(c => inDegree[c.id] === 0).map(c => c.id);
    const order    = [];

    while (queue.length) {
        const id = queue.shift();
        order.push(id);
        for (const dependent of (rdeps[id] || []))
        if (--inDegree[dependent] === 0) queue.push(dependent);
    }

    if (order.length !== formulaCells.length)
        throw new Error('Circular reference detected in formulas');

    for (const id of order)
        updateCellValue(tag(id), true);
    }

    // --- Recursive descent parser ---

    let pos, expr;

    function parse(input) {
    expr = input;
    pos  = 0;
    const result = parseExpression();
    if (pos < expr.length) throw new Error(`Unexpected character at pos ${pos}: "${expr[pos]}"`);
    return result;
    
}

function parseExpression() {
  let left = parseTerm();

  while (pos < expr.length && (expr[pos] === '+' || expr[pos] === '-')) {
    const op = expr[pos++];
    const right = parseTerm();
    left = op === '+' ? left + right : left - right;
  }

  return left;
}

function parseTerm() {
  let left = parseFactor();

  while (pos < expr.length && (expr[pos] === '*' || expr[pos] === '/')) {
    const op = expr[pos++];
    const right = parseFactor();
    if (op === '/' && right === 0) throw new Error('Division by zero');
    left = op === '*' ? left * right : left / right;
  }

  return left;
}

function parseFactor() {
  // Handle unary minus
  if (expr[pos] === '-') {
    pos++;
    return -parseFactor();
  }

  // Handle parentheses
  if (expr[pos] === '(') {
    pos++;
    const result = parseExpression();
    if (expr[pos] !== ')') throw new Error('Missing closing parenthesis');
    pos++;
    return result;
  }

  // Parse number
  const start = pos;
  while (pos < expr.length && /[\d.]/.test(expr[pos])) pos++;
  if (pos === start) throw new Error(`Expected number at pos ${pos}: "${expr[pos]}"`);
  return parseFloat(expr.slice(start, pos));
}


// end of formula parsing and evaluation ===============================


// Copies the table's data cells to the clipboard in a format Google Sheets can paste,
// preserving cell values (or formulas), font-weight, text color, and background color.
// Both text/html (for Sheets styling) and text/plain (TSV fallback) are written.
function copyTableForSheets(tableId) {
    const table = tag(tableId.toLowerCase())
    if (!table) return

    const escapedId = tableId.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const cellIdPattern = new RegExp(`^${escapedId}-[A-Z]+[1-9]\\d*$`)

    const tsvRows = []
    const htmlRows = []

    for (const tr of table.rows) {
        const dataCells = [...tr.cells].filter(
            cell => cell.tagName === 'TD' && cellIdPattern.test(cell.id)
        )
        if (dataCells.length === 0) continue

        const tsvRow = []
        const htmlCells = []

        for (const cell of dataCells) {
            const value = cell.dataset.formula || cell.textContent.trim()

            const styleParts = []
            if (cell.style.fontWeight)      styleParts.push(`font-weight:${cell.style.fontWeight}`)
            if (cell.style.color)           styleParts.push(`color:${cell.style.color}`)
            if (cell.style.backgroundColor) styleParts.push(`background-color:${cell.style.backgroundColor}`)

            const styleAttr = styleParts.length ? ` style="${styleParts.join(';')}"` : ''
            htmlCells.push(`<td${styleAttr}>${sheetsEscapeHtml(value)}</td>`)
            tsvRow.push(value)
        }

        htmlRows.push(`<tr>${htmlCells.join('')}</tr>`)
        tsvRows.push(tsvRow.join('\t'))
    }

    if (htmlRows.length === 0) return

    const htmlStr = `<table>${htmlRows.join('')}</table>`
    const tsvStr  = tsvRows.join('\n')

    navigator.clipboard.write([
        new ClipboardItem({
            'text/html':  new Blob([htmlStr], { type: 'text/html' }),
            'text/plain': new Blob([tsvStr],  { type: 'text/plain' })
        })
    ]).catch(() => {
        navigator.clipboard.writeText(tsvStr)
        message({text:"Copied as plain text (styling not included).", title:"Copied", buttons:[], seconds:3})
    })
}

function sheetsEscapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}


function init() {
    initSheets()

}
// Do not paste away this bottom part ---------------------------------------------             
              
              
    init()                                             