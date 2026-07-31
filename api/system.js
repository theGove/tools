const globals = {
    systemUrl: "https://system.availabooks.com",
    appUrl: "https://app.availabooks.com",
    bookInfo: null,
    pageData: {},
    variables: {},
    user: {},
    courses: [],
    /** @type {{ lastByBook?: Record<string, { chapter: string; section: string; path?: string; updatedAt: string }> } | null} */
    bookActivity: null,
    /** When true, section changes are saved to the course book-activity API. */
    trackBookActivity: false,
    /** @type {ReturnType<typeof setTimeout> | null} */
    bookActivitySaveTimer: null,
    /** Last section id applied by scroll-spy ("" = chapter intro / no hash). */
    lastScrollSectionKey: null,
    /** When true, scroll-spy will not rewrite the location hash. */
    suppressSectionScrollSpy: false,
}

/**
 * Loads the signed-in user and refreshes login + course UI in the menu.
 */
function getUserRecord() {
    fetch(globals.appUrl + "/api/auth/me", { credentials: "include" }).then(response => {
        if (!response.ok) { throw new Error('Network response was not ok. Could not get user record') }
        return response.json()
    }).then(data => {
        console.log("data", data)
        const previousOrg = globals.user?.organizationId ?? null
        globals.user = data.user
        // Prefer the org already selected this page load if /me has none yet.
        if (globals.user && !globals.user.organizationId && previousOrg) {
            globals.user.organizationId = previousOrg
        }
        updateLoginButton()
        updateMenuCourses()
    })

}

function updateLoginButton() {
    const loginButton = document.querySelector(".login-button")
    if (!loginButton) { return }
    if (globals.user) {
        console.log("we are loged in")
        const name = [globals.user.firstName, globals.user.lastName].filter(Boolean).join(" ")
        loginButton.title = name || globals.user.email
        loginButton.classList.add("logged-in")
    } else {
        loginButton.title = "Log in"
        loginButton.classList.remove("logged-in")
    }
}

function searchBook() {
    fetch(`/feeds/posts/default?alt=json&label=chapter&v=2&orderby=relevance&max-results=100&q=label%3Achapter+${encodeURIComponent(tag("search").value)}&start-index=1&rewriteforssl=true`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            //console.log(data); 
            tag("search-results").replaceChildren()
            if (data.feed.entry) {
                for (entry of data.feed.entry) {
                    buildChapterSearchResult(entry)
                }
            } else {
                // add no results found message if needed
                const chapterResultDiv = document.createElement("div");
                chapterResultDiv.appendChild(document.createTextNode("No Results Found"))
                tag("search-results").appendChild(chapterResultDiv)
            }

        })

}
function findLink(links) {
    // takes a set of links from a blogger feed and returns the one with labeled "alternate"
    for (const link of links) {
        if (link.rel === 'alternate') {
            return link
        }
    }
}
function buildChapterSearchResult(entry) {
    //console.log(entry)
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = entry.content.$t

    const chapterResultLink = document.createElement("a");
    chapterResultLink.className = "chapter-result-link"
    chapterResultLink.href = findLink(entry.link).href.split("/").pop()
    chapterResultLink.style.color = "black"
    const chapterResultDiv = document.createElement("div");
    chapterResultDiv.className = "search-result"
    const resultTitleDiv = document.createElement("div");
    resultTitleDiv.className = "search-result-title"
    resultTitleDiv.appendChild(document.createTextNode(entry.title.$t))
    chapterResultDiv.appendChild(resultTitleDiv)
    const searchTerm = tag("search").value
    for (const result of findPhraseWithContext(tempDiv.innerText, searchTerm, 5)) {
        console.log("result:", result)
        const regex = new RegExp(searchTerm, "gi");
        const markedResult = result.replace(regex, `<span class="search-term">${searchTerm}</span>`);
        const resultLineDiv = document.createElement("div");
        resultLineDiv.className = "search-result-line"
        resultLineDiv.innerHTML = markedResult
        chapterResultDiv.appendChild(resultLineDiv)

    }


    chapterResultLink.appendChild(chapterResultDiv)
    tag("search-results").appendChild(chapterResultLink)


}

function entryHasLabel(entry, label) {
    for (const category of entry.category) {
        if (category.term === label) {
            return true
        }
    }
    return false
}


function findPhraseWithContext(text, phrase, contextCount = 10) {
    const words = text.split(/\s+/);
    const phraseWords = phrase.toLowerCase().split(/\s+/);
    const results = [];

    for (let i = 0; i <= words.length - phraseWords.length; i++) {
        // Check if the next sequence of words matches the phrase
        let match = true;
        for (let j = 0; j < phraseWords.length; j++) {
            const cleanWord = words[i + j].replace(/[^\w\s]/g, "").toLowerCase();
            if (cleanWord !== phraseWords[j]) {
                match = false;
                break;
            }
        }

        if (match) {
            // Get context: 10 words before the phrase start, 10 words after the phrase end
            const start = Math.max(0, i - contextCount);
            const end = i + phraseWords.length + contextCount;

            const snippet = words.slice(start, end).join(" ");
            results.push(snippet);

            // Move index forward by phrase length to avoid overlapping sub-matches
            i += phraseWords.length - 1;
        }
    }

    return results;
}

function init() {
    // This function  gets the bookInfo from the correct location and sends it to initialize.  Also loads development code if running locally

    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        alert("Running on localhost. Local code and auth cookies will NOT be loaded unless you change the hostname to local.availabooks.com")
    }

    // bring in code that runs locally for debugging and testing
    if (location.hostname.startsWith("local.availabooks.com")) {
        loadCrossOrigin(`${location.origin}/tools/localCode/dev.js`)
    } else {
        // bring in the book info from the book post
        loadCrossOrigin(`${origin}/feeds/posts/default/-/book?alt=json-in-script&max-results=1&callback=initialize`);
    }

}

function initialize(bookInfoFeed) {

    globals.bookInfo = JSON.parse(bookInfoFeed.feed.entry[0].content.$t)
    console.log("globals.bookInfo", globals.bookInfo)

    getUserRecord()
    setVariables()
    buildMenu()
    configureBook()

    // set up searching the full content of book
    tag("search").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchBook();
        }
    });
    tag("search-button").addEventListener("click", searchBook)


    // Set a function onscroll - this will activate if the user scrolls
    //dims the buttons when the user scrolls
    window.onscroll = setDimness
    bindSectionScrollSpy()

    window.addEventListener('hashchange', function () {
        globals.suppressSectionScrollSpy = true
        if (window.location.hash) {
            scroll_to(window.location.hash.substring(1))
        } else {
            showSection(1)
        }
        globals.lastScrollSectionKey = (window.location.hash || "").replace(/^#/, "")
        scheduleBookActivitySave()
        setTimeout(() => {
            globals.suppressSectionScrollSpy = false
            globals.lastScrollSectionKey = null
            syncHashToSectionInView()
        }, 700)
    });

    window.addEventListener('resize', setTopMargin);
    setTopMargin()
    //console.log("hash", window.location.hash)
    if (window.location.hash) {
        const id = window.location.hash.substring(1)
        globals.lastScrollSectionKey = id
        globals.suppressSectionScrollSpy = true
        scroll_to(id)
        setTimeout(() => {
            globals.suppressSectionScrollSpy = false
            globals.lastScrollSectionKey = null
            syncHashToSectionInView()
        }, 700)
    } else {
        showSection(1)
        syncHashToSectionInView()
    }
}

function configureBook() {
    document.body.style.setProperty('--font-zoom', globals.variables.fontZoom);
}

function setVariables() {
    //read the globals.variables from local storage.  if not present create them and save to local storage
    const pathArray = window.location.pathname.split("/")
    globals.variables.year = pathArray[1]
    globals.variables.month = pathArray[2]

    const storedVariables = localStorage.getItem("book-settings")
    if (storedVariables === null) {
        // storedVariables do not yet exits
        globals.variables.fontZoom = 1
        localStorage.setItem(`book-settings`, JSON.stringify(globals.variables))
    } else {
        globals.variables = JSON.parse(storedVariables)
    }

    //console.log("globals.variables",globals.variables)
    //console.log("storedVariables",storedVariables)

}

function setDimness() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    //document.documentElement.scrollTop+document.documentElement.clientHeight,document.documentElement.scrollHeight
    if (scrollTop < 20 || Math.abs((scrollTop + clientHeight) - scrollHeight) < 5) {
        dimButtons('bright')
        dimHeader('bright')
    } else {
        dimButtons('dim')
        dimHeader('dim')
    }
    //hideMenu()
}


function setTopMargin() {

    const header = document.getElementsByTagName("header")[0]
    if (header) {
        const margin = header.offsetHeight
        for (section of document.querySelectorAll('.chapter-section')) {
            section.style.marginTop = `calc((${margin * 1.1}px  * var(--font-zoom))`
        }
    }

}

function scroll_to(id, recordHash = true) {
    // Scroll to the specified element, being sure it is visible
    //console.log("scrollTo", id)
    hideMenu()
    const target = tag(id)
    if (!target) { return }

    const sectionRoot = target.closest(".chapter-section")
    if (sectionRoot) {
        showSection(sectionRoot.id.split("-")[1], false)
        if (id !== sectionRoot.id) {
            target.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    if (recordHash) {
        window.location.hash = "#" + id
    }
}

function tag(id) {
    return document.getElementById(id)
}

function dimButtons(brightOrDim) {
    for (const button of document.querySelectorAll('.nav')) {
        if (brightOrDim === 'bright') {
            button.classList.remove("dim-button")
        } else {
            // Dim the button
            button.classList.add("dim-button")
        }
    }
}
function dimHeader(brightOrDim) {
    for (const header of document.getElementsByTagName("header")) {
        if (brightOrDim === 'bright') {
            header.classList.remove("dim-header")
        } else {
            // Dim the button
            header.classList.add("dim-header")
        }
    }
}
function showSection(section, recordHash = true) {
    // section can be a number or 'next' or 'prior' or 'all'
    let sectionsToHide = []
    let sectionToShow = 1
    let currentlyShowing = 0
    let buttonNavigatgion = false
    const sections = document.querySelectorAll('.chapter-section')

    if (sections.length === 0) { return }

    if (section === 'all') {  // not currently used or tested
        for (const elem of sections) {
            elem.style.display = 'block'
        }
        return
    }




    // find the section to hide
    for (const elem of sections) {
        if (elem.style.display !== 'none') {
            currentlyShowing = parseInt(elem.id.split('-')[1])
            //console.log("currentlyShowing", currentlyShowing)
            sectionsToHide.push(currentlyShowing)
        }
    }

    // find section to show
    if (isNaN(section)) {
        // section s string and should be 'next' or 'prior'
        buttonNavigatgion = true
        if (section === 'next') {
            sectionToShow = currentlyShowing + 1
        } else {
            //section === 'prior'
            sectionToShow = currentlyShowing - 1
        }
    } else {
        // section numeric
        sectionToShow = section
    }

    // prevents sectionToShow from being out of bounds
    if (isNaN(sectionToShow)) { return }

    if (sectionToShow < 1) {

        const components = window.location.pathname.split('/')
        priorChapter = parseInt(components[components.length - 1].split('.')[0]) - 1
        if (priorChapter < 1) {
            window.location.href = 'toc.html'
        } else {
            window.location.href = priorChapter + '.html'
            return
        }

    } else if (sectionToShow > sections.length) {
        // navigate to next chapter
        // needs to be updated to work with TOC, for now, it will guess the chapter number


        if (!globals.pageData.bookend) {
            globals.pageData.bookend = tag("page-data").dataset.bookend
            //console.log('tag("page-data").dataset.bookend',tag("page-data").dataset.bookend)
        }
        if (globals.pageData.bookend === "true") {
            message({ text: "You have reached the end of this book.  Thank you for using Availabooks.", title: "Book Over", buttons: [], seconds: 8 })
        } else {
            const components = window.location.pathname.split('/')
            nextChapter = parseInt(components[components.length - 1].split('.')[0]) + 1
            window.location.href = nextChapter + '.html'
        }
        return
    }

    for (const sectionNumber of sectionsToHide) {
        tag('section-' + sectionNumber).style.display = 'none'
    }

    tag('section-' + sectionToShow).style.display = 'block'

    if (sectionToShow === 1) {
        window.scrollTo(0, 0)
    } else {
        window.scrollTo(0, 25)
        if (recordHash) {
            window.location.hash = 'section-' + sectionToShow
        }
    }

    scheduleBookActivitySave(String(sectionToShow))

}

function navigate(direction) {
    const path = location.pathname.replace(".", "/").split("/")

    let nextNumber = null
    if (direction === "prior") {
        nextNumber = parseInt(path[3]) - 1
        if (nextNumber < 1) {
            return// no where to go
        }
    } else {
        nextNumber = parseInt(path[3]) + 1
        if (nextNumber > window.lastChapterId) {
            return// no where to go
        }
    }


    path[3] = nextNumber + "." + path.pop()
    //console.log("I'm navigating",path.join("/"))
    window.location.href = path.join("/")

    return
    // assuming full chapter navigation



    // used for the navigation buttons. direction is 'next' or 'prior'
    targetNode = tag(direction + "-button")
    const parentNode = targetNode.parentNode

    const clonedElement = targetNode.cloneNode(true);
    targetNode.remove()

    if (direction === 'next') {
        showSection('next')
    } else {
        // direction === 'prior'
        showSection('prior')
    }
    parentNode.appendChild(clonedElement)

}
function showMenu() {
    // show the menu
    //console.log("showing menu")

    let menuWidth = tag('menu').offsetWidth

    if (menuWidth === 0) {
        tag('menu').style.display = 'block'
        menuWidth = tag('menu').offsetWidth
    }
    tag('menu').style.left = '0'

}

function hideMenu() {
    let menuWidth = tag('menu').offsetWidth
    tag('menu').style.left = `-${menuWidth + 10}px`

}

function copyThisPrompt(event) {
    //console.log("at copyThisPrompt")  
    //showToast("I'm juicing!")
    const prior = event.target.previousElementSibling;
    if (!prior) return;

    navigator.clipboard.writeText(prior.innerText)
        .then(() => showToast("prompt for AI copied"))
        .catch(console.error);
}


function buildMenu() {

    console.log("I'm building the menu!")


    const html = [`
        <div class='menu-header'><span class='material-symbols-outlined menu-button' onclick='hideMenu()'>close</span><span id='book-title'><a href='toc.html'>${globals.bookInfo.title}</a></span></div>
        <div id='menu-content'>
        <div id='menu-courses'></div>
        <div id='toc'>
    `]

    for (const chapter of globals.bookInfo.chapters) {
        if (chapter.sections) {
            let chapterNumber = window.location.pathname.split("/").pop().split(".")[0]
            if (chapterNumber === chapter.id) {
                html.push("<details open>")
                globals.bookInfo.currentChapter = chapterNumber
            } else {
                html.push("<details>")
            }
            getChaptSections(chapter, html)
            html.push("</details>")
        } else {
            let label = ""
            if (chapter.label) {
                label = chapter.label + ": "
            }
            html.push(`<div>${label}<a href="${chapter.id}.html">${chapter.text}</a></div>`)
        }
        window.lastChapterId = parseInt(chapter.id)
    }

    html.push(`</div>
        <div id='tools'>
            Text Size: 
            <span class='material-symbols-outlined tool' onclick='fontSize(.1)'>text_increase</span>
            <span class='material-symbols-outlined tool' onclick='fontSize(-.1)'>text_decrease</span>
            <span class='material-symbols-outlined tool' onclick='fontSize()'>rotate_auto</span>
        </div>  
        <div id='search-div'>
        <h6>Search Book</h6>  
        <input id='search' placeholder='search book'/><span class='material-symbols-outlined tool' id='search-button'>search</span></div>
        <div id='search-results'/>
        <div id='ai-tools'>
            <details>
            <summary>Tools available in this book</summary>
            <div>
    `)
    // make a place to receive the tools here 
    console.log("book info tools", globals.bookInfo.tools)
    for (const tool of globals.bookInfo.tools) {
        console.log(tool)
        html.push(`<div id="menu-tool-${tool}"></div>`)

    }




    html.push(`<div/>
            </details>                
        </div> 
        </div>  
    `)

    //get the tools
    tag("menu").innerHTML = html.join("\n")
    bindMenuCourses()
    updateMenuCourses()
    for (const tool of globals.bookInfo.tools) {
        console.log(tool)
        const toolUrl = `${globals.systemUrl}/feeds/posts/default/-/${tool}?alt=json-in-script&max-results=1&callback=loadMenuTool`
        loadCrossOrigin(toolUrl);

    }


}

/**
 * Escapes text before inserting into HTML.
 * @param {string} value - Raw text.
 */
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
}

/**
 * Formats non-learner role labels for display in the menu course list.
 * @param {{ role?: string | null; roles?: string[] }} course - Course membership.
 */
function courseRoleLabel(course) {
    const roles =
        Array.isArray(course.roles) && course.roles.length > 0
            ? course.roles
            : course.role
                ? [course.role]
                : []
    const visible = roles.filter(
        (role) => typeof role === "string" && role.trim() && role.trim().toLowerCase() !== "learner"
    )
    return visible.length > 0 ? visible.join(", ") : ""
}

/**
 * Extracts a book slug from an availabooks.com host or blog URL.
 * @param {string | null | undefined} hostOrUrl - Hostname or URL like sql.availabooks.com.
 */
function bookSlugFromHost(hostOrUrl) {
    if (!hostOrUrl || typeof hostOrUrl !== "string") {
        return null
    }
    let host = hostOrUrl.trim().toLowerCase()
    try {
        if (host.includes("://")) {
            host = new URL(host).hostname
        }
    } catch {
        // keep host as trimmed string
    }
    host = host.split("/")[0]
    const suffix = ".availabooks.com"
    if (!host.endsWith(suffix)) {
        return null
    }
    const slug = host.slice(0, -suffix.length)
    return slug && !slug.includes(".") ? slug : null
}

/**
 * Returns the slug for the book the user is viewing (subdomain of availabooks.com).
 */
function currentBookSlug() {
    const fromBlog = bookSlugFromHost(globals.bookInfo?.blogUrl)
    if (fromBlog) {
        return fromBlog
    }
    return bookSlugFromHost(location.hostname)
}

/**
 * Finds the first enrolled course that includes the given book slug.
 * @param {Array<{ book?: string[]; workosOrganizationId: string }>} courses - Course memberships.
 * @param {string} bookSlug - Book slug to match.
 */
function firstCourseWithBook(courses, bookSlug) {
    return (
        courses.find((course) => courseBookSlugs(course).includes(bookSlug)) ||
        null
    )
}

/**
 * Copies course-select API fields onto globals.user.
 * @param {{ organizationId?: string | null; role?: string | null; roles?: string[]; permissions?: string[] }} payload - Select response or clear payload.
 */
function applyCourseSelection(payload) {
    if (!globals.user) {
        return
    }
    globals.user.organizationId = payload.organizationId ?? null
    globals.user.role = payload.role ?? null
    globals.user.roles = Array.isArray(payload.roles) ? payload.roles : []
    globals.user.permissions = Array.isArray(payload.permissions)
        ? payload.permissions
        : []
}

/**
 * Clears the active course on the client so the menu shows no current course.
 */
function clearActiveCourse() {
    applyCourseSelection({
        organizationId: null,
        role: null,
        roles: [],
        permissions: [],
    })
    globals.bookActivity = null
    globals.trackBookActivity = false
}

/**
 * Selects a course organization via the API without navigating to a book.
 * @param {string} organizationId - WorkOS organization id.
 */
async function selectCourseOrganization(organizationId) {
    const response = await fetch(globals.appUrl + "/api/auth/course/select", {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.status !== "selected") {
        console.error("Could not select course", payload)
        return false
    }
    applyCourseSelection(payload)
    return true
}

/**
 * Auto-selects (or clears) the active course so it matches the current book.
 * @param {Array<{ book?: string[]; workosOrganizationId: string }>} courses - Course memberships.
 */
async function syncActiveCourseToCurrentBook(courses) {
    if (!globals.user?.id) {
        return
    }
    const bookSlug = currentBookSlug()
    if (!bookSlug) {
        return
    }

    const organizationId = globals.user.organizationId ?? null
    const current = organizationId
        ? courses.find((course) => course.workosOrganizationId === organizationId)
        : null
    const currentMatches = Boolean(
        current && courseBookSlugs(current).includes(bookSlug),
    )
    if (currentMatches) {
        return
    }

    const match = firstCourseWithBook(courses, bookSlug)

    if (!organizationId) {
        if (!match) {
            return
        }
        await selectCourseOrganization(match.workosOrganizationId)
        return
    }

    if (match) {
        await selectCourseOrganization(match.workosOrganizationId)
        return
    }

    clearActiveCourse()
}

/**
 * Builds the public URL for a course book, optionally at a saved chapter/section.
 * @param {string} slug - Book slug (subdomain of availabooks.com).
 * @param {{ chapter?: string; section?: string; path?: string } | null} [position] - Saved position for the book.
 */
function bookUrl(slug, position) {
    const base = `https://${slug}.availabooks.com`
    const path =
        typeof position?.path === "string" &&
        position.path.startsWith("/") &&
        !position.path.includes("://")
            ? position.path
            : "/"
    const hash = path === "/" ? "" : bookSectionHash(position?.section)
    return base + path + hash
}

/**
 * Returns a location hash for a saved section, or "" for section 1 / missing.
 * @param {string | undefined} section - Saved section id or number.
 */
function bookSectionHash(section) {
    if (!section || section === "1") {
        return ""
    }
    const numbered = parseInt(section, 10)
    if (String(numbered) === section && numbered >= 1) {
        return "#section-" + numbered
    }
    if (section === "section-1") {
        return ""
    }
    return "#" + section
}

/**
 * Collects leaf section ids from a bookInfo chapter/section tree.
 * @param {{ id?: string; sections?: unknown[] } | null | undefined} node - Chapter or nested section.
 */
function flattenSectionIds(node) {
    if (!node || !Array.isArray(node.sections)) {
        return []
    }
    /** @type {string[]} */
    const ids = []
    for (const child of node.sections) {
        if (!child || typeof child !== "object") {
            continue
        }
        const section = /** @type {{ id?: string; sections?: unknown[] }} */ (child)
        if (Array.isArray(section.sections) && section.sections.length > 0) {
            ids.push(...flattenSectionIds(section))
        } else if (typeof section.id === "string" && section.id.trim()) {
            ids.push(section.id.trim())
        }
    }
    return ids
}

/**
 * Returns ordered in-chapter section elements (TOC heading ids, else .chapter-section).
 */
function chapterSectionElements() {
    const chapterId = currentChapterId()
    const chapter = Array.isArray(globals.bookInfo?.chapters)
        ? globals.bookInfo.chapters.find((c) => String(c.id) === String(chapterId))
        : null
    const fromToc = flattenSectionIds(chapter)
        .map((id) => tag(id))
        .filter((el) => el instanceof HTMLElement)
    if (fromToc.length > 0) {
        return fromToc
    }
    return [...document.querySelectorAll(".chapter-section")].filter(
        (el) => el instanceof HTMLElement && el.id && el.style.display !== "none",
    )
}

/**
 * Returns the section element id currently in view, or null for the chapter intro.
 */
function activeChapterSectionId() {
    const sections = chapterSectionElements()
    if (sections.length === 0) {
        return null
    }
    const header = document.getElementsByTagName("header")[0]
    const offset = (header?.offsetHeight || 0) + 8
    const first = sections[0]
    if (window.scrollY < 24 && first.getBoundingClientRect().top > offset + 40) {
        return null
    }
    let active = first
    for (const el of sections) {
        if (el.getBoundingClientRect().top <= offset) {
            active = el
        } else {
            break
        }
    }
    return active.id || null
}

/**
 * Updates the URL hash to match the section in view (no scroll jump).
 */
function syncHashToSectionInView() {
    if (globals.suppressSectionScrollSpy) {
        return
    }
    const sectionId = activeChapterSectionId()
    const key = sectionId || ""
    if (key === globals.lastScrollSectionKey) {
        return
    }
    globals.lastScrollSectionKey = key
    const savedId = normalizeSectionMarker(sectionId)
    const nextHash = bookSectionHash(savedId)
    const currentHash = window.location.hash || ""
    if (currentHash !== nextHash) {
        history.replaceState(null, "", window.location.pathname + window.location.search + nextHash)
    }
    scheduleBookActivitySave(savedId)
}

/**
 * Normalizes a DOM section id for activity/hash (e.g. section-3 → 3).
 * @param {string | null | undefined} sectionId - Element id or marker.
 */
function normalizeSectionMarker(sectionId) {
    if (!sectionId) {
        return "1"
    }
    const numbered = /^section-(\d+)$/.exec(sectionId)
    if (numbered) {
        return numbered[1]
    }
    return sectionId
}

/**
 * Binds a throttled scroll listener that keeps the hash aligned with the section in view.
 */
function bindSectionScrollSpy() {
    let ticking = false
    window.addEventListener(
        "scroll",
        () => {
            if (ticking) {
                return
            }
            ticking = true
            requestAnimationFrame(() => {
                ticking = false
                syncHashToSectionInView()
            })
        },
        { passive: true },
    )
}

/**
 * Returns the book slugs attached to a course.
 * @param {{ book?: string[] }} course - Course membership from the API.
 */
function courseBookSlugs(course) {
    return Array.isArray(course.book)
        ? course.book.filter((slug) => typeof slug === "string" && slug.trim())
        : []
}

/**
 * Renders per-book switch/open buttons for a course.
 * @param {{ title?: string; workosOrganizationId: string; book?: string[] }} course - Course membership.
 * @param {boolean} isCurrentCourse - Whether this course is the session org.
 */
function renderCourseBookButtons(course, isCurrentCourse) {
    const orgId = escapeHtml(course.workosOrganizationId)
    const books = courseBookSlugs(course)
    const activeSlug = currentBookSlug()
    const courseTitle = course.title || "this course"

    if (books.length === 0) {
        if (isCurrentCourse) {
            return ""
        }
        return `
            <div class="menu-course-books">
                <button
                    type="button"
                    class="menu-course-select menu-course-select-plain"
                    data-menu-course-select
                    data-organization-id="${orgId}"
                    title="${escapeHtml(`Switch to ${courseTitle}`)}"
                >
                    Switch
                </button>
            </div>
        `
    }

    return `
        <div class="menu-course-books">
            ${books
                .map((slug) => {
                    const safeSlug = escapeHtml(slug)
                    const destination = bookUrl(slug)
                    const isHere = activeSlug === slug
                    if (isHere) {
                        return `
                            <button
                                type="button"
                                class="menu-course-select menu-course-select-current"
                                disabled
                                aria-current="true"
                                title="${escapeHtml(`You are already viewing ${destination}`)}"
                            >
                                ${safeSlug}
                            </button>
                        `
                    }
                    const title = isCurrentCourse
                        ? `Go to ${destination}`
                        : `Switch to ${courseTitle} and go to ${destination}`
                    return `
                        <button
                            type="button"
                            class="menu-course-select"
                            data-menu-course-select
                            data-organization-id="${orgId}"
                            data-book-slug="${safeSlug}"
                            title="${escapeHtml(title)}"
                        >
                            ${safeSlug}
                        </button>
                    `
                })
                .join("")}
        </div>
    `
}

/**
 * Wires click handling for selecting a course from the side menu.
 */
function bindMenuCourses() {
    const container = tag("menu-courses")
    if (!container || container.dataset.bound === "true") {
        return
    }
    container.dataset.bound = "true"

    /**
     * Handles a course/book select trigger from click or keyboard.
     * @param {Event} event - Click or keydown event.
     * @param {HTMLElement} selectEl - Element with data-menu-course-select.
     */
    function activateMenuCourseSelect(event, selectEl) {
        if (selectEl instanceof HTMLButtonElement && selectEl.disabled) {
            return
        }
        // Keep book buttons / course rows inside <summary> from toggling the course dropdown.
        event.preventDefault()
        event.stopPropagation()
        const organizationId = selectEl.getAttribute("data-organization-id")
        if (!organizationId) {
            return
        }
        const bookSlug = selectEl.getAttribute("data-book-slug")
        void selectMenuCourse(organizationId, selectEl, bookSlug)
    }

    container.addEventListener("click", (event) => {
        const target = event.target
        if (!(target instanceof HTMLElement)) {
            return
        }
        const selectEl = target.closest("[data-menu-course-select]")
        if (!(selectEl instanceof HTMLElement)) {
            return
        }
        activateMenuCourseSelect(event, selectEl)
    })

    container.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return
        }
        const target = event.target
        if (!(target instanceof HTMLElement)) {
            return
        }
        if (!(target instanceof HTMLLIElement) || !target.hasAttribute("data-menu-course-select")) {
            return
        }
        activateMenuCourseSelect(event, target)
    })
}

/**
 * Loads courses for the signed-in user and renders them in the side menu.
 */
async function updateMenuCourses() {
    const container = tag("menu-courses")
    if (!container) {
        return
    }

    if (!globals.user || !globals.user.id) {
        container.innerHTML = `
            <p class="menu-courses-hint">
                <a href="#" onclick="handleLogin(); return false;">Log in</a> to see your courses.
            </p>
        `
        return
    }

    container.innerHTML = `
        <p class="menu-courses-hint">Loading…</p>
    `

    try {
        const courses = await getCourses()
        globals.courses = courses
        await syncActiveCourseToCurrentBook(courses)
        await syncBookActivityForActiveCourse()
        renderMenuCourses(container, courses)
    } catch (err) {
        console.error(err)
        container.innerHTML = `
            <p class="menu-courses-hint">Could not load courses.</p>
        `
    }
}

/**
 * Renders one course row for the menu course picker dropdown.
 * @param {{ title: string; workosOrganizationId: string; book?: string[]; role?: string | null; roles?: string[] }} course - Course membership.
 * @param {boolean} isCurrentCourse - Whether this course is the session org.
 */
function renderMenuCourseItem(course, isCurrentCourse) {
    const roleLabel = courseRoleLabel(course)
    const roleParts = [roleLabel, isCurrentCourse ? "Current" : ""].filter(Boolean)
    const roleHtml = roleParts.length
        ? `<span class="menu-course-role">${escapeHtml(roleParts.join(" · "))}</span>`
        : ""
    const books = courseBookSlugs(course)
    const firstBook = books[0] || ""
    const orgId = escapeHtml(course.workosOrganizationId)
    const courseTitle = course.title || "Untitled course"
    const rowTitle = firstBook
        ? `Switch to ${courseTitle} and go to ${bookUrl(firstBook)}`
        : `Switch to ${courseTitle}`
    return `
        <li
            class="menu-course${isCurrentCourse ? " menu-course-current" : ""}"
            data-menu-course-select
            data-organization-id="${orgId}"
            ${firstBook ? `data-book-slug="${escapeHtml(firstBook)}"` : ""}
            title="${escapeHtml(rowTitle)}"
            role="button"
            tabindex="0"
        >
            <div class="menu-course-meta">
                <span class="menu-course-title">${escapeHtml(courseTitle)}</span>
                ${roleHtml}
            </div>
            ${renderCourseBookButtons(course, isCurrentCourse)}
        </li>
    `
}

/**
 * Renders the current course name with a dropdown of other available courses.
 * @param {HTMLElement} container - Menu courses root element.
 * @param {Array<{ id: string; title: string; workosOrganizationId: string; book?: string[]; role?: string | null; roles?: string[] }>} courses - Course memberships.
 */
function renderMenuCourses(container, courses) {
    const organizationId = globals.user?.organizationId ?? null

    if (!courses.length) {
        container.innerHTML = `
            <p class="menu-courses-hint">You are not enrolled in any courses yet.</p>
        `
        return
    }

    const current = courses.find((course) => course.workosOrganizationId === organizationId)
    const others = courses.filter((course) => course.workosOrganizationId !== organizationId)
    const currentTitle = escapeHtml(current?.title || "Select a course")
    const hasDropdown = others.length > 0 || !current

    const dropdownCourses = current ? others : courses
    const dropdownHtml = hasDropdown
        ? `
            <ul class="menu-courses-list">
                ${dropdownCourses
                    .map((course) =>
                        renderMenuCourseItem(course, course.workosOrganizationId === organizationId)
                    )
                    .join("")}
            </ul>
        `
        : ""

    const currentBooksHtml =
        current && courseBookSlugs(current).length > 0
            ? renderCourseBookButtons(current, true)
            : ""

    if (!hasDropdown) {
        container.innerHTML = `
            <div class="menu-courses-picker">
                <div class="menu-courses-current">
                    <span class="menu-courses-current-name">${currentTitle}</span>
                    ${currentBooksHtml}
                </div>
            </div>
        `
        return
    }

    container.innerHTML = `
        <details class="menu-courses-picker">
            <summary class="menu-courses-current">
                <span class="menu-courses-current-name">${currentTitle}</span>
                ${currentBooksHtml}
                <span class="material-symbols-outlined menu-courses-chevron" aria-hidden="true">expand_more</span>
            </summary>
            ${dropdownHtml}
        </details>
    `
}

/**
 * Selects a course organization, then opens the chosen book when provided.
 * @param {string} organizationId - WorkOS organization id.
 * @param {HTMLElement} trigger - Switch/open control that was clicked.
 * @param {string | null} bookSlug - Book slug to open after switching, if any.
 */
async function selectMenuCourse(organizationId, trigger, bookSlug) {
    /** @type {HTMLButtonElement | null} */
    let feedbackButton = trigger instanceof HTMLButtonElement ? trigger : null
    if (!feedbackButton) {
        const buttons = [...trigger.querySelectorAll("button[data-menu-course-select]")]
        feedbackButton =
            (bookSlug
                ? buttons.find((button) => button.getAttribute("data-book-slug") === bookSlug)
                : null) ||
            buttons[0] ||
            null
    }

    const originalLabel = feedbackButton ? feedbackButton.textContent : null
    if (feedbackButton) {
        feedbackButton.disabled = true
        feedbackButton.setAttribute("aria-busy", "true")
        feedbackButton.setAttribute(
            "aria-label",
            bookSlug ? "Opening book" : "Switching course",
        )
        feedbackButton.innerHTML =
            '<span class="material-symbols-outlined menu-course-select-spinner" aria-hidden="true">progress_activity</span>'
    }
    if (!(trigger instanceof HTMLButtonElement)) {
        trigger.setAttribute("aria-busy", "true")
        trigger.classList.add("menu-course-selecting")
    }

    /**
     * Restores the trigger after a failed switch/open.
     */
    function restoreTrigger() {
        if (feedbackButton) {
            feedbackButton.disabled = false
            feedbackButton.removeAttribute("aria-busy")
            feedbackButton.removeAttribute("aria-label")
            feedbackButton.textContent = originalLabel || (bookSlug || "Switch")
        }
        if (!(trigger instanceof HTMLButtonElement)) {
            trigger.removeAttribute("aria-busy")
            trigger.classList.remove("menu-course-selecting")
        }
    }

    try {
        const alreadySelected = globals.user?.organizationId === organizationId
        if (!alreadySelected) {
            const selected = await selectCourseOrganization(organizationId)
            if (!selected) {
                restoreTrigger()
                return
            }
        }

        if (bookSlug) {
            const activity = await fetchBookActivity(organizationId)
            const position = activity?.lastByBook?.[bookSlug] ?? null
            window.location.href = bookUrl(bookSlug, position)
            return
        }

        await updateMenuCourses()
    } catch (err) {
        console.error(err)
        restoreTrigger()
    }
}

function loadMenuTool(x) {
    const toolId = "menu-tool-" + x.feed.entry[0].title.$t
    const parts = x.feed.entry[0].content.$t.split("==================================================")
    //console.log("loading menu tool", parts[0])

    // load the css
    const style = document.createElement('style');
    style.textContent = parts[0]
    document.head.appendChild(style);

    //load the JS
    injectJs(parts[1])

    // place the HTML
    console.log("tryoing to palce", toolId)
    tag(toolId).innerHTML = parts[2].trim()

}



function getChaptSections(obj, html) {
    //console.log("at chapterSections",obj)
    let label = ""
    if (obj.label) {
        label = obj.label + ": "
    }

    html.push("<summary>")
    html.push(`<span>${label}</span><span><a href="${newPathName(window.location.pathname, obj.id)}">${obj.text}</a></span>`)
    html.push("</summary>")
    for (const child of obj.sections) {
        if (child.sections) {
            html.push('<div class="toc-section-container"><details>')
            getChaptSections(child, html)
            html.push("</details></div>")
        } else {
            html.push('<div class="toc-text-container">')
            html.push(`<a href="${newPathName(window.location.pathname, obj.id)}#${child.id}"><span></span><span>${child.text}</a></span>`)
            html.push("</div>")
        }

    }
    function lastId(id) {
        const idArray = id.split("-")
        return idArray[idArray.length - 1]
    }
    function newPathName(path, id) {
        const pathArray = path.split("/")
        const fileArray = pathArray[pathArray.length - 1].split(".")
        const currentChapter = fileArray[0]
        //console.log("about to split", id, typeof id)
        const linkChapter = id.split("-").shift()

        if (linkChapter === currentChapter) {
            // link to a place on the same page
            return ""
        } else {
            //link to a place on a different page
            fileArray[0] = linkChapter
            pathArray[pathArray.length - 1] = fileArray.join(".")
            return pathArray.join("/")
        }


    }
}


function showHighlight() {

    document.getElementsByTagName("p")[0].replaceChildren(document.getElementsByTagName("p")[0].innerHTML)

}

//==========how to use the messaging system===========
// // Informational, auto-closes after 5 seconds
// message({text:"Saved successfully.", title:"Saved", buttons:[], seconds:5})

// // Warning with Yes/No buttons
// message({text:"Overwrite existing data?", title:"Confirm", type:"warning",
//     buttons:[{text:"Yes", fn:doOverwrite}, {text:"No", fn:closeMessage}]})

// // Critical error, modal (blocks the page until dismissed)
// message({text:"Database connection failed.", title:"Critical Error", type:"error", modal:true,
//     buttons:[{text:"OK", fn:closeMessage}]})

// // Custom buttons, auto-dismiss after 10s, non-blocking
// message({text:"New version available.", title:"Update", seconds:10,
//     buttons:[{text:"Update Now", fn:startUpdate}, {text:"Later", fn:closeMessage}]})





//==========how to use the toast notification system===========
// showToast("Saved.")                  // neutral info
// showToast("Saved successfully.", "success")
// showToast("Save failed.", "error")
function getToastEl() {
    let el = tag("toast")
    if (!el) {
        el = document.createElement("div")
        el.id = "toast"
        el.hidden = true
        document.body.appendChild(el)
    }
    return el
}

function showToast(message, kind) {
    const toastEl = getToastEl();
    toastEl.textContent = message;
    toastEl.className = "toast" + (kind ? " " + kind : "");
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
        toastEl.hidden = true;
    }, 3200);
}

function closeMessage(evt) {
    let dialog
    if (evt && evt.target) {
        let elem = evt.target
        while (elem && !elem.classList.contains("msg-dialog")) elem = elem.parentNode
        dialog = elem
    }
    if (dialog) {
        if (dialog._msgOverlay) dialog._msgOverlay.remove()
        dialog.remove()
    }
}

// message({text, title, buttons, seconds, type, modal})
//   text    : message HTML/text  (default: "An error occurred.")
//   title   : title bar text     (default: "System Message")
//   buttons : [{text, fn}, ...]  — e.g. [{text:"Yes",fn:yesFn},{text:"No",fn:closeMessage}]
//             common labels: "OK", "Cancel", "Yes", "No"  (default: [{text:"OK",fn:closeMessage}])
//   seconds : auto-close delay in seconds (optional)
//   type    : "info" (default) | "warning" | "error"
//   modal   : true = block page interaction until dismissed; false (default) = non-blocking
function message({ text: messageHtml = "An error occurred.", title: titleText = "System Message", buttons: callbacks = [{ text: "OK", fn: closeMessage }], seconds: secondsUntilClose, type = "info", modal = false } = {}) {

    // ensure gallery container exists
    let galley = tag("msg-galley")
    if (!galley) {
        galley = document.createElement("div")
        galley.id = "msg-galley"
        galley.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;min-width:300px;max-width:min(500px,90vw);"
        document.body.appendChild(galley)
    }

    // inject styles once
    if (!tag("msg-styles")) {
        const s = document.createElement("style")
        s.id = "msg-styles"
        s.textContent = `
            #msg-galley { pointer-events:none; }
            .msg-dialog { pointer-events:auto; width:100%; background:#fff;
                          box-shadow:0 4px 24px rgba(0,0,0,0.22); position:relative;
                          overflow:hidden; box-sizing:border-box; }
            .msg-title   { padding:10px 36px 8px 14px; font-weight:600; font-size:14px; color:#fff; }
            .msg-info    .msg-title { background:#2196f3; }
            .msg-warning .msg-title { background:#ff9800; }
            .msg-error   .msg-title { background:#f44336; }
            .msg-message { padding:10px 14px; font-size:13px; color:#333; border-radius:0; }
            .msg-button-bar { display:flex; justify-content:flex-end; gap:8px; padding:8px 14px 12px; }
            .msg-button-bar button { padding:4px 14px; border-radius:4px; border:1px solid #ccc;
                                     cursor:pointer; font-size:13px; background:#f0f0f0; }
            .msg-button-bar button:hover { background:#e0e0e0; }
            .msg-close { position:absolute; top:8px; right:8px; cursor:pointer; color:#000;
                         line-height:1; display:flex; align-items:center;
                         background:#d0d0d0; border:1px solid #000; border-radius:3px; padding:1px 2px; }
            .msg-close:hover { background:#bbb; }
            .msg-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:9998; }
        `
        document.head.appendChild(s)
    }

    // modal overlay blocks the rest of the page
    let overlay = null
    if (modal) {
        overlay = document.createElement("div")
        overlay.className = "msg-overlay"
        document.body.appendChild(overlay)
    }

    const dialog = document.createElement("div")
    dialog.className = "msg-dialog msg-" + type
    dialog._msgOverlay = overlay

    // X dismiss button
    const closeBtn = document.createElement("div")
    closeBtn.className = "msg-close"
    const closeIcon = document.createElement("span")
    closeIcon.className = "material-symbols-outlined"
    closeIcon.textContent = "close"
    closeIcon.style.fontSize = "calc(15px * var(--font-zoom, 1))"
    closeBtn.appendChild(closeIcon)
    closeBtn.addEventListener("click", closeMessage)
    dialog.appendChild(closeBtn)

    const titleBar = document.createElement("div")
    titleBar.className = "msg-title"
    titleBar.textContent = titleText
    dialog.appendChild(titleBar)

    const messagePane = document.createElement("div")
    messagePane.className = "msg-message"
    messagePane.innerHTML = messageHtml
    dialog.appendChild(messagePane)

    if (callbacks.length > 0) {
        const buttonBar = document.createElement("div")
        buttonBar.className = "msg-button-bar"
        for (const cb of callbacks) {
            const button = document.createElement("button")
            button.textContent = cb.text
            button.addEventListener("click", cb.fn)
            buttonBar.appendChild(button)
        }
        dialog.appendChild(buttonBar)
    }

    galley.appendChild(dialog)

    if (secondsUntilClose) {
        const timeoutId = setTimeout(() => {
            if (overlay) overlay.remove()
            dialog.remove()
        }, secondsUntilClose * 1000)
        dialog.addEventListener("mousemove", () => clearTimeout(timeoutId))
    }
}


function fontSize(adjustment) {
    //adjust the font size for the post

    //const zoom = parseFloat(window.getComputedStyle(document.body).getPropertyValue('--font-zoom'))
    if (!adjustment) {
        globals.variables.fontZoom = 1
        //document.body.style.setProperty('--font-zoom', 1);
    } else {
        globals.variables.fontZoom = Math.round((globals.variables.fontZoom + adjustment) * 10) / 10
        //document.body.style.setProperty('--font-zoom', zoom + adjustment);
    }
    document.body.style.setProperty('--font-zoom', globals.variables.fontZoom);
    localStorage.setItem(`book-settings`, JSON.stringify(globals.variables))

}


function playAudio(td) {
    let elem = td
    while (elem.className !== "audio-control") {
        elem = elem.parentElement
        //console.log(elem)
    }
    //console.log("---->", elem.dataset.next)  
    audioDataUrl = elem.id + ".html"

    fetch(audioDataUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // The fetched content is the base64 string.
            // We need to create a data URL to play it.
            // This example assumes the audio is in WAV format. Adjust as needed.

            base64String = html.split("~~~~")[1]
            //console.log("base64String",base64String)
            const mimeType = 'audio/mpeg';
            const audioSrc = `data:${mimeType};base64,${base64String}`;


            // Create a new Audio object or element
            //        const audio = new Audio(audioSrc);

            // To allow the user to see the controls, you can append an audio element to the DOM
            const audioEl = document.createElement('audio');
            audioEl.playbackRate = 2;
            audioEl.controls = true;
            audioEl.src = audioSrc;
            td.replaceChildren("");


            elem.replaceChildren(audioEl)
            audioEl.addEventListener('ended', () => {

                let audioTag = tag(elem.dataset.next)
                if (!audioTag) { return }
                audioTag = audioTag.firstElementChild
                audioTag.scrollIntoView({ behavior: 'smooth' })
                if (audioTag.tagName.toLowerCase() === "audio") {
                    audioTag.currentTime = 0;
                    audioTag.play()
                } else {
                    audioTag.click()
                }
            });
            // Play the audio automatically
            audioEl.play()
                .then(() => {
                    //console.log('Audio is now playing.');
                })
                .catch(e => {
                    console.log('Could not play audio. Check the console for an Autoplay Policy error.');
                    console.error('Audio play error:', e);
                })
                .finally(() => {
                    //playButton.disabled = false;
                });
        })
        .catch(error => {
            console.error(error)
            //handleError(error);
            //playButton.disabled = false;
        });

}


function makePrompt(evt, props) {
    if (evt) {
        let elem = evt.target
        const html = []
        while (elem.tagName !== "H" + props.level) {
            elem = elem.previousElementSibling
            if (elem.tagName === "DIV" && elem.className === "monaco") {
                continue
            }
            html.unshift(elem.outerHTML)
        }
        //console.log("fount it:", elem.tagName) 
        //console.log(html)
        const turndownService = new TurndownService();
        const prompt = ["I'm learning about javascript.  Please help me understand it by giving me three options: Walk me through the main points, Give me different examples covering the same content, or quizzing me on the main points.  Here's the text of the section:"]
        prompt.push(turndownService.turndown(html.join("")))

        prompt.push("Here's the table of content from the book so you can know what i've already learned and what else is coming up")
        prompt.push(tag("toc").innerText.split("\n\n\n").join("\n").split("\n\n").join("\n"))


        navigator.clipboard.writeText(prompt.join("\n\n"))
            .then(() => console.log("Copied!"))
            .catch(err => console.error("Failed:", err));
    }

}

function handleLogin() {

    window.location.href = getUrl(globals.systemUrl + "/2000/02/login.html?next=" + encodeURI(location.href))
}

function getUrl(url) {
    return url
}
/**
 * Fetches courses for the signed-in user. Returns [] when unauthenticated.
 */
async function getCourses() {
    const response = await fetch(globals.appUrl + "/api/courses", {
        credentials: "include",
    })
    if (!response.ok) {
        return []
    }
    const data = await response.json()
    return Array.isArray(data.courses) ? data.courses : []
}

/**
 * Returns the chapter id from the current page path (e.g. "3" from "/y/m/3.html").
 */
function currentChapterId() {
    const file = window.location.pathname.split("/").pop() || ""
    const id = file.split(".")[0]
    if (!id || id === "toc") {
        return null
    }
    return id
}

/**
 * Returns the current section marker: numbered `.chapter-section` when present,
 * otherwise the location hash id, otherwise "1".
 */
function currentSectionId() {
    const visible = currentlyVisibleSection()
    if (visible) {
        return String(visible)
    }
    const hash = (window.location.hash || "").replace(/^#/, "").trim()
    if (hash) {
        return hash
    }
    return "1"
}

/**
 * Fetches book activity for a course organization.
 * @param {string} organizationId - WorkOS organization id.
 */
async function fetchBookActivity(organizationId) {
    const response = await fetch(
        globals.appUrl + "/api/courses/" + encodeURIComponent(organizationId) + "/book-activity",
        { credentials: "include" },
    )
    if (!response.ok) {
        return null
    }
    const data = await response.json()
    return data.activity && typeof data.activity === "object" ? data.activity : null
}

/**
 * Saves last chapter/section for the current book in the active course.
 * @param {{ book: string; chapter: string; section: string; path?: string }} position - Position to store.
 */
async function putBookActivity(position) {
    const organizationId = globals.user?.organizationId
    if (!organizationId) {
        console.warn("book-activity: skip save, no organizationId")
        return null
    }
    const response = await fetch(
        globals.appUrl + "/api/courses/" + encodeURIComponent(organizationId) + "/book-activity",
        {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(position),
        },
    )
    if (!response.ok) {
        console.error("Could not save book activity", await response.json().catch(() => ({})))
        return null
    }
    const data = await response.json()
    if (data.activity && typeof data.activity === "object") {
        globals.bookActivity = data.activity
    }
    return data.activity ?? null
}

/**
 * Debounces saving the current reading position (30s after the last change).
 * @param {string} [section] - Section to store; defaults to currentSectionId().
 */
function scheduleBookActivitySave(section) {
    if (!globals.trackBookActivity) {
        return
    }
    if (!globals.user?.id || !globals.user?.organizationId) {
        return
    }
    const book = currentBookSlug()
    const chapter = currentChapterId()
    const sectionId = section == null || section === "" ? currentSectionId() : String(section)
    const path = window.location.pathname
    if (!book || !chapter || !sectionId) {
        console.warn("book-activity: skip save", { book, chapter, section: sectionId })
        return
    }

    if (globals.bookActivitySaveTimer) {
        clearTimeout(globals.bookActivitySaveTimer)
    }
    globals.bookActivitySaveTimer = setTimeout(() => {
        globals.bookActivitySaveTimer = null
        console.log("book-activity: saving", { book, chapter, section: sectionId, path })
        void putBookActivity({ book, chapter, section: sectionId, path })
    }, 30_000)
}

/**
 * Returns the currently visible chapter-section number, or null.
 */
function currentlyVisibleSection() {
    for (const elem of document.querySelectorAll(".chapter-section")) {
        if (elem.style.display !== "none") {
            const n = parseInt(elem.id.split("-")[1], 10)
            if (!isNaN(n)) {
                return n
            }
        }
    }
    return null
}

/**
 * Loads book activity for the active course so later section changes can be saved.
 */
async function syncBookActivityForActiveCourse() {
    globals.trackBookActivity = false
    globals.bookActivity = null

    const organizationId = globals.user?.organizationId
    if (!globals.user?.id || !organizationId) {
        return
    }

    const activity = await fetchBookActivity(organizationId)
    globals.bookActivity = activity || { lastByBook: {} }

    globals.trackBookActivity = true
    scheduleBookActivitySave()
}

init()

