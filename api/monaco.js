        const codeEditors = {}
        const environments = {
            "javascript": {
                language: {
                    label: "JavaScript",
                    syntax: "javascript",
                }
            },
            "html": {
                language: {
                    label: "HTML",
                    syntax: "html",
                }
            },
            "appsscript": {
                message:"To run this code, copy and paste it into the Google Apps Script editor: https://script.google.com/",
                language: {
                    label: "Google Apps Script",
                    syntax: "javascript",
                }
            },
            "appsscriptsheets": {
                message:"To run this code, copy and paste it into the Google Apps Script editor that is built into Google Sheets: Extensions > Apps Script",
                language: {
                    label: "Google Apps Script",
                    syntax: "javascript",
                }
            },
            "nodejs": {
                message:"To run this code, copy and paste it into your node js console on your computer",
                language: {
                    label: "Node.js",
                    syntax: "javascript",
                }
            },
            "jade": {
                message:"To run this code, copy and paste it into the editor of the JADE add-in for Excel",
                language: {
                    label: "JADE",
                    syntax: "javascript",
                }
            },
            "officescriptexcel": {
                message:"To run this code, copy and paste it into the Automate system of Excel",
                language: {
                    label: "Office Script (Excel)",
                    syntax: "javascript",
                }
            },
            "officescriptword": {
                message:"To run this code, copy and paste it into the Automate system of Word",
                language: {
                    label: "Office Script (Word)",
                    syntax: "javascript",
                }
            },
        }

        function initMonaco() {
            if (typeof require !== "function") {
                setTimeout(initMonaco, 100)
                return
            }
            require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' } });
            window.MonacoEnvironment = { getWorkerUrl: () => proxy };

            function proxy() {
                URL.createObjectURL(new Blob([`
                    self.MonacoEnvironment = {
                        baseUrl: 'https://unpkg.com/monaco-editor@latest/min/'
                    };
                    importScripts('https://unpkg.com/monaco-editor@latest/min/vs/base/worker/workerMain.js');
                `], { type: 'text/javascript' }));
            }

            require(["vs/editor/editor.main"], function () {



                // process original code blocks
                let pres = document.querySelectorAll("pre.code")
                for (let x = 0; x < pres.length; x++) {
                    const pre = pres[x]
                    const environment = pre.getAttribute("data-environment") || "browser"
                    //console.log("Environment:", environment)
                    if (environment === "message") continue

                    hideOriginalCode(pre, x)
                    insertMonaco(pre, x, environment)

                }

                // process triple backtick code blocks
                pres = document.querySelectorAll("pre")
                for (let x = 0; x < pres.length; x++) {
                    if (pres[x].classList.length===1 && pres[x].classList[0].includes("-")) {
                        // this is a code block to replace with monaco
                        const pre = pres[x]
                        hideOriginalCode(pre, x)
                        insertMonaco(pre, x)
                    }

                }


            });

            function hideOriginalCode(elemToHide, sequence){
                // hides the code block that holds the code before monaco is initialized, and gives it an id so that we can reference it later to reset the code
                elemToHide.id = "original-code" + sequence
                elemToHide.style.display = "none"
                let code = elemToHide.innerText.trim()

                // in some cases, pandoc adds extra new line at the end of each line, so we trim the code to remove those
                const codeArray= code.split("\n\n")
                let hasLinesWithLineFeed = false
                for(let i=0; i<codeArray.length; i++){
                    if(codeArray[i].includes("\n")){
                        hasLinesWithLineFeed=true
                        break
                    }
                }
                if(!hasLinesWithLineFeed){
                    elemToHide.innerHTML = code.split("\n\n").join("\n")
                }


            }

            function insertMonaco(pre, x){

                const classData = pre.classList[0].split("-")
                const environment = classData[0]  
                const example = classData[1]==="example"  

                const container = document.createElement("div")
                container.className = "monaco"
                container.id = "code" + x
                container.dataset.environment = environment

                let code = pre.innerText.trim()

                const editorHolder = document.createElement("div")
                editorHolder.className = "editor-holder"

                const editorDiv = document.createElement("div")
                editorDiv.className = "editor"
                editorHolder.appendChild(editorDiv)

                const monacoBar = document.createElement("div")
                monacoBar.className = "monaco-bar"

                const label = document.createElement("span")
                label.className = "monaco-bar-label"
                label.textContent = environments[environment].language.label
                monacoBar.appendChild(label)

                const wrapBtn = addTool("wrap_text", toggleWrap, "Toggle line wrap")
                const fitBtn  = addTool("fit_screen", fitCode, "Fit to content")
                const copyBtn = addTool("content_copy", copyCode, "Copy code")
                const resetBtn = addTool("refresh", resetCode, "Reset")
                const runBtn = addTool("play_arrow", runCode, "Run")
                runBtn.dataset.action = "run"

                const funcSelect = document.createElement("select")
                funcSelect.className = "monaco-func-select"
                funcSelect.title = "Select function to run"
                funcSelect.style.cssText = "background:#3c3c3c;color:#8b949e;border:1px solid rgba(255,255,255,0.12);border-radius:4px;padding:0 4px;height:24px;font-size:11px;cursor:pointer;margin-right:2px;max-width:140px;"
                populateFuncSelect(funcSelect, code)

                monacoBar.appendChild(wrapBtn)
                monacoBar.appendChild(fitBtn)
                monacoBar.appendChild(copyBtn)
                monacoBar.appendChild(resetBtn)
                if (!example) {
                    const isJsRunnable = !environments[environment].message && environments[environment].language.syntax !== "html"
                    if (isJsRunnable) monacoBar.appendChild(funcSelect)
                    monacoBar.appendChild(runBtn)
                }

                const con = document.createElement("div")
                con.className = "console"
                con.style.display = "none"

                const span = document.createElement("span")
                span.className = "exitButton"
                span.classList.add("material-symbols-outlined")
                span.appendChild(document.createTextNode("close"))
                span.addEventListener("click", clearConsole)
                con.appendChild(span)

                container.replaceChildren(monacoBar)
                container.appendChild(editorHolder)
                container.appendChild(con)
                pre.after(container)

                codeEditors["code" + x] = monaco.editor.create(editorDiv, {
                    value: code,
                    language: environments[environment].language.syntax,
                    theme: 'vs-dark',
                    lineHeight: 22,
                    fontSize: 14,
                    folding: false,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 4, bottom: 4 },
                    renderLineHighlight: 'none',
                    overviewRulerLanes: 0,
                    fontFamily: "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
                    fontLigatures: true,
                    wordWrap: "on",
                    //automaticLayout: true,
                });
                const editor = codeEditors["code" + x]  
                let lines = editor.getModel().getLineCount() + 2
                const contentHeight = lines * 22
                const editorElement = editor.getDomNode()
                editorElement.style.height = `${contentHeight}px`
                editor.layout({ width: editorElement.clientWidth, height: contentHeight })

                editor.onDidContentSizeChange((e) => {
                    const contentHeight = Math.min(1000, e.contentHeight)
                    const margin = tag("code" + x).offsetHeight - parseInt(editorElement.style.height.slice(0, -2)) + 20
                    if(window.innerHeight > contentHeight + margin){
                        editorElement.style.height = `${contentHeight}px`;
                        editor.layout({ height: contentHeight, width: editorElement.clientWidth });
                        const rect = tag("code" + x).getBoundingClientRect();
                        if(rect.bottom > window.innerHeight){
                            tag("code" + x).scrollIntoView({behavior:"smooth", block:"end"})
                        }
                    }
                });

                editor.getModel().onDidChangeContent(() => {
                    populateFuncSelect(funcSelect, editor.getValue())
                })
            }

        }


        function addTool(label, fn, title) {
            const tool = document.createElement("span")
            tool.className = "monaco-tool material-symbols-outlined"
            tool.title = title || label
            tool.appendChild(document.createTextNode(label))
            tool.addEventListener("click", fn)
            return tool
        }

        function extractFunctions(code) {
            const names = [], seen = new Set()
            const re1 = /\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g
            const re2 = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?(?:\(|function\s*\()/g
            let m
            while ((m = re1.exec(code)) !== null) if (!seen.has(m[1])) { seen.add(m[1]); names.push(m[1]) }
            while ((m = re2.exec(code)) !== null) if (!seen.has(m[1])) { seen.add(m[1]); names.push(m[1]) }
            return names
        }

        function populateFuncSelect(select, code) {
            const prev = select.value
            select.innerHTML = ""
            const allOpt = document.createElement("option")
            allOpt.value = ""
            allOpt.textContent = "run all"
            select.appendChild(allOpt)
            const funcs = extractFunctions(code)
            for (const fn of funcs) {
                const opt = document.createElement("option")
                opt.value = fn
                opt.textContent = fn + "()"
                select.appendChild(opt)
            }
            if (prev && [...select.options].some(o => o.value === prev)) select.value = prev
            else if (funcs.length > 0) select.value = funcs[0]
        }

        function toggleWrap(evt) {
            let elem = evt.target
            while (!elem.classList.contains("monaco")) elem = elem.parentElement
            const editor = codeEditors[elem.id]
            const current = editor.getOption(monaco.editor.EditorOption.wordWrap)
            const next = current === "off" ? "on" : "off"
            editor.updateOptions({ wordWrap: next })
            evt.target.classList.toggle("active", next === "on")
        }

        function fitCode(evt) {
            let elem = evt.target
            while (!elem.classList.contains("monaco")) elem = elem.parentElement
            const editor = codeEditors[elem.id]
            const contentHeight = editor.getContentHeight()
            const editorElement = editor.getDomNode()
            editorElement.style.height = `${contentHeight}px`
            editor.layout({ height: contentHeight, width: editorElement.clientWidth })
        }

        function copyCode(evt) {
            let elem = evt.target
            while (!elem.classList.contains("monaco")) elem = elem.parentElement
            navigator.clipboard.writeText(codeEditors[elem.id].getValue())
        }

        function clearConsole(evt) {
            let elem = evt.target
            while (!elem.classList.contains("monaco")) elem = elem.parentElement
            const con = elem.querySelector(".console")
            con.style.display = "none"
            con.querySelectorAll(".console-line").forEach(line => line.remove())
            con.querySelectorAll(".html-preview").forEach(f => f.remove())

        }

        function resetCode(evt) {
            let elem = evt.target
            while (!elem.classList.contains("monaco")) elem = elem.parentElement
            window.newConsole.exampleOutput = elem.querySelector(".console")
            codeEditors[elem.id].setValue(tag("original-" + elem.id).innerText)
            clearConsole(evt)
        }

        function runCode(evt) {
            let elem = evt.target
            while (!elem.classList.contains("monaco")) elem = elem.parentElement
            window.newConsole.exampleOutput = elem.querySelector(".console")
            const envKey = elem.dataset.environment
            if (environments[envKey]?.language?.syntax === "html") {
                const con = elem.querySelector(".console")
                con.style.backgroundColor = "#fff"
              //  con.querySelectorAll(".html-preview").forEach(f => f.remove())
                const iframe = document.createElement("iframe")
                iframe.className = "html-preview"
                iframe.srcdoc = codeEditors[elem.id].getValue()
                let css="width:100%;border:none;min-height:100px;display:block;"
                if(con.querySelectorAll(".html-preview").length > 0){                    
                    css += "border-top:5px solid #ccc;"
                }
                iframe.style.cssText = css
                iframe.onload = () => {
                    iframe.style.height = iframe.contentDocument.body.scrollHeight + "px"
                }
                con.appendChild(iframe)
                con.style.display = "block"
                return
            }
            if(environments[envKey].message){
                    const con = elem.querySelector(".console")
                    const div = document.createElement("div")
                    div.className = "console-line"
                    div.appendChild(document.createTextNode(environments[envKey].message))
                    con.appendChild(div)
                    con.style.display = "block"
                    return
            }
            const code = codeEditors[elem.id].getValue()
            const funcSelect = elem.querySelector(".monaco-func-select")
            const selectedFunc = funcSelect ? funcSelect.value : ""
            const s = document.createElement("script")
            const fullCode = selectedFunc
                ? code + "\n" + selectedFunc + "()"
                : "function deltaGammaBetaZeta(){" + code + "\n}deltaGammaBetaZeta()"

            s.replaceChildren(fullCode)
            try{
              document.head.appendChild(s)
            }catch(e){
                console.log(e)
            }
        }

        function print(...args) {
            window.newConsole.log.apply(console, [...args]);
        }

        function init() {
            const s = document.createElement("script")
            s.src = "https://unpkg.com/monaco-editor@latest/min/vs/loader.js"
            document.head.appendChild(s)

            window.newConsole = {}
            initMonaco()

            window.newConsole.log = console.log;
            console.log = function (...args) {
                window.newConsole.log.apply(console, [...args]);
                try {
                    const div = document.createElement("div")
                    div.className = "console-line"
                    div.appendChild(document.createTextNode(args.join(" ")))
                    window.newConsole.exampleOutput.appendChild(div)
                    window.newConsole.exampleOutput.style.display = "block"
                } catch (e) {}
            };

            window.addEventListener('error', (event) => {
                if (typeof window.newConsole.exampleOutput === "object" && event.lineno>0) {
                    const div = document.createElement("div")
                    div.className = "console-line error"
                    div.appendChild(document.createTextNode(`[line ${event.lineno}] ${event.message}`))
                    window.newConsole.exampleOutput.appendChild(div)
                    window.newConsole.exampleOutput.style.display = "block"
                }
            });
        }

// Do not paste away this bottom part ---------------------------------------------             
              
              
    init()                                             