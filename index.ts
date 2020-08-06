const w : number = window.innerWidth 
const h : number = window.innerHeight 
const scGap : number = 0.02 
const sizeFactor : number = 4
const delay : number = 20
const colors : Array<string> = ["#3F51B5", "#4CAF50", "#2196F3", "#009688", "#FFEB3B"]
const backColor : string = "#bdbdbd"
const parts : number = 3
const strokeFactor : number = 90

class ScaleUtil {
    
    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n 
    }

    static sinify(scale : number) : number {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {
    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawTriBlockers(context : CanvasRenderingContext2D, scale : number) {
        const sf : number = ScaleUtil.sinify(scale)
        const sf1 : number = ScaleUtil.divideScale(sf, 0, parts)
        const sf2 : number = ScaleUtil.divideScale(sf, 1, parts)
        const sf3 : number = ScaleUtil.divideScale(sf, 2, parts)
        const size : number = Math.min(w, h) / sizeFactor 
        for (var j = 0; j < 3; j++) {
            const y = (h / 2 - size / 2) * (j % 2) * sf2 
            context.save()
            context.translate((w / 2 - size / 2) * j, y)
            context.fillRect(0, -size * sf1, size, size * sf1)
            context.restore()
        }
        const xSize : number = w * 0.5 * sf3
        const ySize : number = h * 0.5 * sf3 
        DrawingUtil.drawLine(context, 0, 0, xSize, -ySize)
        DrawingUtil.drawLine(context, w * 0.5, -h * 0.5, w * 0.5 + xSize, -h * 0.5 + ySize)
        DrawingUtil.drawLine(context, w , 0, w - w * sf3, 0)
    }

    static drawTBNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        context.strokeStyle = colors[i]
        context.fillStyle = colors[i]
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor 
        context.save()
        context.translate(0, h)
        DrawingUtil.drawTriBlockers(context, scale)
        context.restore()
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w 
        this.canvas.height = h 
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor 
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += scGap * this.dir 
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir 
            this.dir = 0
            this.prevScale = this.scale 
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale 
            cb()
        }
    }
}

class Animator {

    animated : boolean = false 
    interval : number 

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true 
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false 
            clearInterval(this.interval)
        }
    }
}

class TBNode {

    next : TBNode 
    prev : TBNode 
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < colors.length - 1) {
            this.next = new TBNode(this.i + 1)
            this.next.prev = this 
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawTBNode(context, this.i, this.state.scale)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : TBNode {
        var curr : TBNode = this.prev 
        if (dir == 1) {
            curr = this.next 
        }
        if (curr) {
            return curr 
        }
        cb()
        return this 
    }
}

class TriBlocker {
    
    curr : TBNode = new TBNode(0)
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(cb)
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    tb : TriBlocker = new TriBlocker()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.tb.draw(context)
    }

    handleTap(cb : Function) {
        this.tb.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.tb.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}