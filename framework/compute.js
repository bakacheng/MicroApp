var worker = new Worker('./src/worker.js')

let e={
    name: 'Initial',
    arg: []
}

function newEvent(event) {
    console.log(event)
    worker.postMessage(event)
}
worker.onmessage = (event) => {
    msg = event.data
    console.log(msg)
    paraName = msg.name
    paraValue = msg.paraValue
    //var func = eval('set'+paraName)
    //new func(paraValue)
}