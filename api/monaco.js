        const codeEditors = {}

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
                    if (pre.getAttribute("data-convert") === "false") continue

                    pre.id = "original-code" + x
                    pre.style.display = "none"

                    const container = document.createElement("div")
                    container.className = "monaco"
                    container.id = "code" + x

                    const code = pre.innerText.trim()

                    const editorHolder = document.createElement("div")
                    editorHolder.className = "editor-holder"

                    const editor = document.createElement("div")
                    editor.className = "editor"
                    editorHolder.appendChild(editor)

                    const monacoBar = document.createElement("div")
                    monacoBar.className = "monaco-bar"

                    const label = document.createElement("span")
                    label.className = "monaco-bar-label"
                    label.textContent = "javascript"
                    monacoBar.appendChild(label)

                    const copyBtn = addTool("content_copy", copyCode, "Copy code")
                    const resetBtn = addTool("refresh", resetCode, "Reset")
                    const runBtn = addTool("play_arrow", runCode, "Run")
                    runBtn.dataset.action = "run"

                    monacoBar.appendChild(copyBtn)
                    monacoBar.appendChild(resetBtn)
                    monacoBar.appendChild(runBtn)

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

                    codeEditors["code" + x] = monaco.editor.create(editor, {
                        value: code,
                        language: 'javascript',
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
                    });

                    let lines = codeEditors["code" + x].getModel().getLineCount() + 2
                    const contentHeight = lines * 22
                    const editorElement = codeEditors["code" + x].getDomNode()
                    editorElement.style.height = `${contentHeight}px`
                    codeEditors["code" + x].layout({ width: editorElement.clientWidth, height: contentHeight })
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
            const code = codeEditors[elem.id].getValue()
            const s = document.createElement("script")
            s.replaceChildren("function deltaGammaBettaZeta(){" + code + "}deltaGammaBettaZeta()")
            document.head.appendChild(s)
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