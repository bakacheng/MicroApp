function render(element, container) {
    workinRoot = {
        dom: container,
        props: {
            children: [element],
        },
        alternate: 1
    }
    deletions = currentRoot
    nextFiber = workinRoot
}

function checkDup(child) {
    if(child.props && 'tt-for' in child.props)
    {
        return child.props['tt-for'].map((item) => {
            return child
        })
    }
    else{
        return child
    }
}
function createElement(type, props, ...children) {
    let chr = []
    children.forEach(child => {
        let ls = (typeof child === "object") ? checkDup(child) : checkDup(createTextElement(child))
        chr = chr.concat(ls)
    })
    return {
        type,
        props: {
            ...props,
            children: chr
        }
    }
}

function createTextElement(text) {
    return {
        type: "TEXT",
        props: {
            nodeValue: text,
            children: [],
        },
    }
}

let nextFiber = null;
let workinRoot = null;
let currentRoot = null;
let deletions = null;

function workLoop(deadline) {
    let shouldYield = false;
    while (nextFiber && !shouldYield) {
        nextFiber = performWork(nextFiber)
        shouldYield = deadline.timeRemaining() < 1
    }

    if (!nextFiber && workinRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performWork(fiber) {
    if(!('tt-if' in fiber.props) || fiber.props['tt-if']){
        if(typeof(fiber.type)==='function'){
            reconcileComponent(fiber)
        }
        else{
            reconcile(fiber)
        }
    }
    if (fiber.child) {
        return fiber.child
    }
    let temp = fiber
    while (temp) {
        if (temp.sibling) {
            return temp.sibling
        }
        temp = temp.return
    }
}

function reconcileComponent(fiber) {
    workinComponent = fiber
    hookIndex = 0
    workinComponent.hooks = []
    reconcileChildren(fiber, [fiber.type(fiber.props)])
}
function reconcile(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props && fiber.props.children)
}

function reconcileChildren(workinFiber, elements) {
    let oldFiber = workinFiber.alternate && workinFiber.alternate.child
    let index = 0
    let prevSibling = null

    if(elements && elements.length){
        if(!oldFiber){
            for(let i=0;i<elements.length;i++){
                const element = elements[i]
                const newFiber = {
                    type: element.type,
                    props: element.props,
                    dom: null,
                    return: workinFiber,
                    alternate: null,
                    effectTag: "PLACEMENT",
                }
                if(i==0){
                    workinFiber.child = newFiber
                }
                else{
                    prevSibling.sibling = newFiber
                }
                prevSibling = newFiber
            }
        }

        while (index < elements.length && oldFiber) {
            let element = elements[index]
            let newFiber = null
            const sameType = oldFiber && element && oldFiber.type===element.type
            if(sameType){
                newFiber = {
                    type: oldFiber.type,
                    props: element.props,
                    dom: oldFiber.dom,
                    return: workinFiber,
                    alternate: oldFiber,
                    effectTag: "UPDATE",
                }
            }
            else if(!sameType && element){
                newFiber = {
                    type: element.type,
                    props: element.props,
                    dom: null,
                    return: workinFiber,
                    alternate: null,
                    effectTag: "PLACEMENT",
                }
            }
            else if(!sameType && oldFiber){
                oldFiber.effectTag = "DELETE"
                deletions.push(oldFiber)
            }
            oldFiber = oldFiber.sibling
            if (index === 0) {
                workinFiber.child = newFiber
            } else if (element) {
                prevSibling.sibling = newFiber
            }
            prevSibling = newFiber
            index++
        }
    }
}

function commitRoot() {
    if(deletions){
        deletions.forEach(commitWork)
    }
    commitWork(workinRoot.child)
    currentRoot = workinRoot
    workinRoot = null
}

function commitWork(fiber) {
    if (!fiber) {
        return
    }
    let domParentFiber = fiber.return
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.return
    }
    const domParent = domParentFiber.dom
    if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
        domParent.appendChild(fiber.dom)
    }
    else if(fiber.effectTag === "DELETE"){
        deleteDom(fiber,domParent)
    }
    else if(fiber.effectTag === "UPDATE" && fiber.dom){
        updateDom(fiber.dom,fiber.alternate.props,fiber.props)
    }
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function deleteDom(fiber,domParent){
    if(fiber.dom){
        domParent.removeChild(fiber.dom)
    }
    else{
        deleteDom(fiber.child,domParent)
    }
}
function updateDom(dom, prevProps, nextProps) {
    for (const prop in prevProps) {
        if(prop!='children' && !(prop in nextProps)){
            if(prop.indexOf('on')===0){
                const eventType = key.slice(2).toLowerCase()
                dom.removeEventListner(eventType,prevProps[prop],false)
            }
            else{
                dom[prop] = ''
            }
        }
    }
    for (const prop in nextProps) {
        if(prop!='children'){
            setAttribute(dom,prop,nextProps[prop])
        }
    }
}
function createDom(fiber) {
    const dom = fiber.type == "TEXT" ? document.createTextNode("") : document.createElement(fiber.type);

    for (const prop in fiber.props) {
        setAttribute(dom, prop, fiber.props[prop]);
    }
    return dom;
}

function isEventListenerAttr(key, value) {
    return typeof value == 'function' && key.startsWith('on')
}
function isStyleAttr(key, value) {
    return key == 'style' && typeof value == 'object'
}
function isPlainAttr(key, value) {
    return typeof value != 'object' && typeof value != 'function'
}

const setAttribute = (dom, key, value) => {
    if (key === 'children') {
        return
    }

    if (key === 'nodeValue') {
        dom.textContent = value
    }
    else if (isEventListenerAttr(key, value)) {
        const eventType = key.slice(2).toLowerCase()
        dom.addEventListener(eventType, value)
    }
    else if (isStyleAttr(key, value)) {
        Object.assign(dom.style, value)
    }
    else if (isPlainAttr(key, value)) {
        dom.setAttribute(key, value)
    }
};

let workinComponent = null
let hookIndex = null
function useState(init) {
    const oldHook = workinComponent.alternate && workinComponent.alternate.hooks && workinComponent.alternate.hooks[hookIndex]
    const hook = {
        state : oldHook?oldHook.state:init
    }
    workinComponent.hooks.push(hook)
    hookIndex++
    const setState = value => {
        hook.state = value
        workinRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }
        nextFiber = workinRoot
        deletions = []
    }
    return [hook.state, setState]
}
const Program = {
    createElement,
    render,
    useState
}