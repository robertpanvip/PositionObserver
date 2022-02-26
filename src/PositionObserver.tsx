interface PositionObserverCallback {
    (entries: PositionObserverEntry[], observer: PositionObserver): void;
}

type TargetMargin = [number, number, number, number]

interface PositionObserverInit {
    targetMargin?: TargetMargin;
}

function getEntries(vm: Map<Element, PositionObserverEntry>) {
    const entries: PositionObserverEntry[] = [];
    vm.forEach((item, target) => {
        entries.push(item)
    })
    return entries;
}

const observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new Map();

export class IntersectionRect {
    readonly bottom: number;
    readonly height: number;
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly width: number;
    readonly x: number;
    readonly y: number;
    private _width?: number;
    private _height?: number;

    constructor(left: number, top: number, _width: number, _height: number) {
        const width = _width >= 0 ? _width : 0;
        const height = _height >= 0 ? _height : 0;
        this.left = left;
        this.top = top;
        this.right = left + width;
        this.bottom = top + height;
        this.width = _width;
        this.height = _height;
        this._width = width;
        this._height = height;
        this.x = left;
        this.y = top;
    }

    toJSON() {
        return JSON.stringify(this)
    }
}

type StrategyRect = Pick<IntersectionRect, 'left' | 'top' | 'width' | 'height'>

class PositionObserverEntry {
    /** 目标元素的矩形信息 **/
    readonly boundingClientRect: DOMRectReadOnly;
    /** 目标元素 **/
    readonly target: Element;

    /** 相交区域和目标元素的比例值 **/
    readonly intersectionRatio: number;

    /** 触发元素 **/
    origin: EventTarget;

    /**可视视窗区域 **/
    parentIntersectionRect: IntersectionRect;

    /** 目标元素和视窗（根）相交的矩形信息 可以称为相交区域 **/
    intersectionRect: IntersectionRect;

    tooltipRect: IntersectionRect;

    /** 目标元素是否可见 **/
    readonly isIntersecting: boolean;

    constructor(target: Element) {
        this.boundingClientRect = target.getBoundingClientRect();
        this.target = target;
        Object.defineProperty(this, 'boundingClientRect', {
            get(): DOMRectReadOnly {
                return target.getBoundingClientRect();
            }
        })
        Object.defineProperty(this, 'intersectionRatio', {
            get(): number {
                return this.intersectionRect?.height / target.getBoundingClientRect().height;
            }
        })
        Object.defineProperty(this, 'isIntersecting', {
            get(): boolean {
                return this.intersectionRatio !== 0;
            }
        })
    }
}

function getLatestVisibleElement(target: Element): Element {
    if (target instanceof HTMLHtmlElement) {
        return target;
    }
    let parentNode = target.parentNode as Element;
    if (parentNode.scrollHeight !== parentNode.clientHeight) {
        return parentNode;
    } else {
        return getLatestVisibleElement(parentNode)
    }
}

function getRelativeParentElement(target: Element) {
    const style = getComputedStyle(target);
    if (style.position === 'absolute') {
        function loop(ele: Element): Element {
            const _style = getComputedStyle(ele);
            if (_style.position === 'relative') {
                return ele
            } else {
                return loop(ele.parentNode as Element)
            }
        }

        return loop(target.parentNode as Element)
    } else {
        return target.parentNode;
    }
}

/**
 * 计算2个窗口相交
 * @param ViewReact
 * @param targetRect
 */
function getRectByStrategy(ViewReact: StrategyRect, targetRect: StrategyRect) {

    const left = Math.max(ViewReact.left, targetRect.left);
    const top = Math.max(ViewReact.top, targetRect.top);
    //pre https://blog.csdn.net/weixin_43395911/article/details/104955302?utm_medium=distribute.pc_relevant.none-task-blog-2~default~baidujs_title~default-1.queryctrv2&spm=1001.2101.3001.4242.2&utm_relevant_index=4
    const _h = Math.min(targetRect.top + targetRect.height, ViewReact.top + ViewReact.height) - Math.max(targetRect.top, ViewReact.top)
    const _w = Math.min(targetRect.left + targetRect.width, ViewReact.left + ViewReact.width) - Math.max(targetRect.left, ViewReact.left)

    return new IntersectionRect(left, top, _w, _h)
}

/**
 * 循环获取可见视口
 * @param target
 * @param targetRect
 */
function loopGetRect(target: Element, targetRect: DOMRect): DOMRect {
    const parent = getRelativeParentElement(target) as Element;
    const parentRect = parent.getBoundingClientRect();

    const intersectionRect = getRectByStrategy(parentRect, targetRect)

    if (!(parent.parentNode instanceof HTMLHtmlElement)) {
        return loopGetRect(parent, intersectionRect)
    } else {
        return intersectionRect
    }
}

function getOriginRect(origin: EventTarget): IntersectionRect {
    return origin instanceof Element ? origin.getBoundingClientRect() : {
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight,
        width: window.innerWidth,
        height: window.innerHeight,
        x: 0,
        y: window.innerHeight,
        toJSON() {
            return JSON.stringify(this)
        }
    }
}

function getIntersectionRect(target: Element, targetRect: DOMRect) {
    const left = targetRect.left
    const top = targetRect.top
    const width = targetRect.width
    const height = targetRect.height;
    const _targetRect = new IntersectionRect(left, top, width, height)

    return loopGetRect(target, _targetRect);
}

function getTooltipRectRect(scrollRect: IntersectionRect, targetRect: DOMRect, intersectionRect: IntersectionRect, init: PositionObserverInit) {
    const targetMargin = init.targetMargin;
    const tooltipRect: any = {
        right: intersectionRect.right + targetMargin[1],
        left: intersectionRect.right,
        top: intersectionRect.top - targetMargin[0],
        bottom: intersectionRect.top,
        height: targetMargin[0],
        width: targetMargin[1],
        x: intersectionRect.right,
        y: intersectionRect.top - targetMargin[0],
    }
    const diffTop = intersectionRect.top - scrollRect.top;
    const diffRight = scrollRect.right-intersectionRect.right;

    if (diffTop >= 0 && diffTop <= targetMargin[0]) {
        tooltipRect.height = diffTop;
        tooltipRect.top = intersectionRect.top - diffTop
    }

    if(diffRight>=0 && diffRight <= targetMargin[1]){
        tooltipRect.width = diffRight;
    }

    if(intersectionRect.width<0){
        tooltipRect.width = targetMargin[1] - Math.abs(intersectionRect.width)
    }

    if (intersectionRect.height < 0 && intersectionRect.height >= -targetMargin[0]) {
        tooltipRect.height = targetMargin[0] - Math.abs(intersectionRect.height)
    } else if (intersectionRect.height < -targetMargin[0]) {
        tooltipRect.height = 0;
        tooltipRect.top = scrollRect.bottom
    }
    return tooltipRect
}

const defaultMargin: [number, number, number, number] = [0, 0, 0, 0]

class PositionObserverSUP {
    private readonly callback: PositionObserverCallback;
    private vm = new Map<Element, PositionObserverEntry>();
    // @ts-ignore
    private resizeObserver: ResizeObserver;
    private readonly init: PositionObserverInit = {targetMargin: [0, 0, 0, 0]}

    constructor(callback: PositionObserverCallback, init?: PositionObserverInit) {
        this.callback = callback;
        if (init) {
            this.init = {
                targetMargin: init.targetMargin || defaultMargin
            }
        }
        // @ts-ignore
        this.resizeObserver = ResizeObserver && new ResizeObserver((entries) => {
            entries.forEach((entry: PositionObserverEntry) => {
                const en = this.vm.get(entry.target);
                const latestElement = getLatestVisibleElement(entry.target);
                const latestRect = latestElement.getBoundingClientRect();
                const targetRect = entry.target.getBoundingClientRect();
                //en.parentIntersectionRect = getOriginRect(latestElement);
                en.parentIntersectionRect = getIntersectionRect(latestElement, latestRect);
                en.intersectionRect = getRectByStrategy(en.parentIntersectionRect, targetRect)
                //en.intersectionRect = getIntersectionRect(entry.target, targetRect);
                en.tooltipRect = getTooltipRectRect(en.parentIntersectionRect, targetRect, en.intersectionRect, this.init)
            })
            this.callback(getEntries(this.vm), this)
        })
    }

    disconnect(): void {
        this.resizeObserver?.disconnect();
        this.vm.clear();
    }

    observe(target: Element): void {
        const entry = new PositionObserverEntry(target)
        this.vm.set(target, entry)

        const loop = (item: Element) => {
            if (item.parentNode) {
                const styles = getComputedStyle(item);
                const addEventListener = (ele: Element | Window) => {
                    ele.addEventListener('scroll', (e) => {

                        const targetRect = entry.target.getBoundingClientRect();
                        const latestElement = getLatestVisibleElement(target);
                        const latestRect = latestElement.getBoundingClientRect();
                        entry.origin = e.target;
                        //entry.parentIntersectionRect = getOriginRect(latestElement);
                        entry.parentIntersectionRect = getIntersectionRect(latestElement, latestRect);
                        entry.intersectionRect = getRectByStrategy(entry.parentIntersectionRect, targetRect)

                        //entry.intersectionRect = getIntersectionRect(target, targetRect);
                        entry.tooltipRect = getTooltipRectRect(entry.parentIntersectionRect, targetRect, entry.intersectionRect, this.init)

                        requestAnimationFrame(() => {
                            this.callback(getEntries(this.vm), this)
                        })
                    })
                }
                if (['auto', 'scroll'].includes(styles.overflow)) {
                    addEventListener(item)
                }
                if (item instanceof HTMLHtmlElement && styles.overflow === 'visible') {
                    addEventListener(window)
                }
                loop(item.parentNode as Element)
            }
        }
        loop(target.parentNode as Element);
        this.resizeObserver?.observe(target)
    }

    unobserve(target: Element): void {
        this.vm.delete(target)
    }
}


class PositionObserver {
    constructor(callback: PositionObserverCallback, init?: PositionObserverInit) {
        if (!(this instanceof PositionObserver)) {
            throw new TypeError('Cannot call a class as a function.');
        }
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        const controller = new PositionObserverSUP(callback, init);
        observers.set(this, controller)
    }

    /**
     * 对象停止监听工作
     */
    disconnect(): void {
        return observers.get(this).disconnect()
    }

    /**
     * 开始监听一个目标元素
     * @param target
     */
    observe(target: Element): void {
        return observers.get(this).observe(target)
    }

    /**
     * 停止监听特定目标元素
     * @param target
     */
    unobserve(target: Element): void {
        return observers.get(this).unobserve(target)
    }
}

export default PositionObserver
