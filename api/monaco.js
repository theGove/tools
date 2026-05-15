        const codeEditors = {}
        const environments = {
            "html": {
                message:"To run this code, copy and paste it into the Google Apps Script editor: https://script.google.com/",
                language: {
                    label: "HTML",
                    syntax: "html",
                }
            },
            "apps-script": {
                message:"To run this code, copy and paste it into the Google Apps Script editor: https://script.google.com/",
                language: {
                    label: "Google Apps Script",
                    syntax: "javascript",
                }
            },
            "apps-script-sheets": {
                message:"To run this code, copy and paste it into the Google Apps Script editor that is built into Google Sheets: Extensions > Apps Script",
                language: {
                    label: "Google Apps Script",
                    syntax: "javascript",
                }
            },
            "node-js": {
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
            "office-script-excel": {
                message:"To run this code, copy and paste it into the Automate system of Excel",
                language: {
                    label: "Office Script (Excel)",
                    syntax: "javascript",
                }
            },
            "office-script-word": {
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
                const pres = document.querySelectorAll("pre.code")
                for (let x = 0; x < pres.length; x++) {
                    const pre = pres[x]
                    const environment = pre.getAttribute("data-environment") || "browser"
                    console.log("Environment:", environment)
                    if (environment === "message") continue
                     
                    pre.id = "original-code" + x
                    pre.style.display = "none"

                    const container = document.createElement("div")
                    container.className = "monaco"
                    container.id = "code" + x
                    container.dataset.environment = environment

                    const code = pre.innerText.trim()

                    const editorHolder = document.createElement("div")
                    editorHolder.className = "editor-holder"

                    const editorDiv = document.createElement("div")
                    editorDiv.className = "editor"
                    editorHolder.appendChild(editorDiv)

                    const monacoBar = document.createElement("div")
                    monacoBar.className = "monaco-bar"

                    const label = document.createElement("span")
                    label.className = "monaco-bar-label"
                    label.textContent = environments[environment]?.language?.label ||   "javascript"
                    monacoBar.appendChild(label)

                    const copyBtn = addTool("content_copy", copyCode, "Copy code")
                    const resetBtn = addTool("refresh", resetCode, "Reset")
                    const runBtn = addTool("play_arrow", runCode, "Run")
                    runBtn.dataset.action = "run"

                    monacoBar.appendChild(copyBtn)
                    monacoBar.appendChild(resetBtn)
                    if (environment !== "none") monacoBar.appendChild(runBtn)

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
                        language: environments[environment]?.language?.syntax ||   "javascript",
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
                        automaticLayout: true,
                    });
                    const editor = codeEditors["code" + x]  
                    let lines = editor.getModel().getLineCount() + 2
                    const contentHeight = lines * 22
                    const editorElement = editor.getDomNode()
                    editorElement.style.height = `${contentHeight}px`
                    editor.layout({ width: editorElement.clientWidth, height: contentHeight })
                    editor.onDidChangeModelContent(() => {
                        const margin = tag("code" + x).offsetHeight - parseInt(editorElement.style.height.slice(0, -2)) +20
                        const contentHeight = editor.getContentHeight(); // Get height of actual code
                        if(window.innerHeight > contentHeight + margin){
                            editorElement.style.height = `${contentHeight}px`;
                            editor.layout({ height: contentHeight, width: editorElement.clientWidth });
                            // scroll the bottom of the editor into view if the content is shorter than the window height
                            const rect = tag("code" + x).getBoundingClientRect();
                            if(rect.bottom > window.innerHeight){
                              tag("code" + x).scrollIntoView({behavior:"smooth", block:"end"})
                            }
                        }
                        console.log(window.innerHeight, editorElement.getBoundingClientRect().bottom)
                    });
                }
            });
        }

        function addTool(label, fn, title) {
            const tool = document.createElement("span")
            tool.className = "monaco-tool material-symbols-outlined"
            tool.title = title || label
            tool.appendChild(document.createTextNode(label))
            tool.addEventListener("click", fn)
            return tool
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
            if (environments[envKey]) {
                const con = elem.querySelector(".console")
                const div = document.createElement("div")
                div.className = "console-line"
                div.appendChild(document.createTextNode(environments[envKey].message))
                con.appendChild(div)
                con.style.display = "block"
                return
            }
            const code = codeEditors[elem.id].getValue()
            const s = document.createElement("script")
            const fullCode = "function deltaGammaBetaZeta(){" + code + "\n}deltaGammaBetaZeta()"
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
                if (typeof window.newConsole.exampleOutput === "object") {
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