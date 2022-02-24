interface PositionObserverCallback {
    (entries: PositionObserverEntry[], observer: PositionObserver): void;
}

function getEntries(vm: Map<Element, PositionObserverEntry>) {
    const entries: PositionObserverEntry[] = [];
    vm.forEach((item, target) => {
        entries.push(item)
    })
    return entries;
}

const observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new Map();

class PositionObserverEntry {
    readonly boundingClientRect: DOMRectReadOnly;
    readonly target: Element;
    intersectionRatio: number;
    intersectionRect: any = {};

    constructor(target: Element) {
        this.boundingClientRect = target.getBoundingClientRect();
        this.target = target;
        Object.defineProperty(this, 'boundingClientRect', {
            get(): DOMRectReadOnly {
                return target.getBoundingClientRect();
            }
        })
    }
}

class PositionObserverSUP {
    private readonly callback: PositionObserverCallback;
    private vm = new Map<Element, PositionObserverEntry>();
    private resizeObserver: ResizeObserver;
    private intersectionObserver: IntersectionObserver;
    private isIntersectionObserver = false

    constructor(callback: PositionObserverCallback) {
        this.callback = callback;
        this.resizeObserver = new ResizeObserver(() => {
            //this.callback(getEntries(this.vm), this)
        })
        let task: NodeJS.Timeout;
        this.intersectionObserver = new IntersectionObserver((entries) => {
            console.log('intersectionObserver', task)
            this.isIntersectionObserver = true;
            clearTimeout(task)
            entries.forEach((entry) => {
                const _entry = this.vm.get(entry.target);
                _entry.intersectionRatio = entry.intersectionRatio;
                _entry.intersectionRect = {
                    bottom: entry.intersectionRect.bottom,
                    height: entry.intersectionRect.height,
                    left: entry.intersectionRect.left,
                    right: entry.intersectionRect.right,
                    top: entry.intersectionRect.top,
                    width: entry.intersectionRect.width,
                    x: entry.intersectionRect.x,
                    y: entry.intersectionRect.y,
                };
            })
            this.callback(getEntries(this.vm), this)
            task = setTimeout(() => {
                console.log('exquted', task)
                this.isIntersectionObserver = false;
            }, 50)
        }, {
            threshold: Array.apply(null, {length: 1000}).map((item: any, index: number) => index / 1000)
        })
    }

    disconnect(): void {
        this.resizeObserver.disconnect();
        this.vm.clear();
    }

    observe(target: Element): void {
        this.intersectionObserver.observe(target)
        const entry = new PositionObserverEntry(target)
        this.vm.set(target, entry)
        const tack: Element[] = [];
        const loop = (item: Element) => {
            if (item.parentNode) {
                const styles = getComputedStyle(item);
                const addEventListener = (ele: Element | Window) => {
                    ele.addEventListener('scroll', () => {
                        console.log('scroll', this.isIntersectionObserver);
                        if (!this.isIntersectionObserver) {

                            //const _item:Element=tack.find(item=>item.scrollHeight !== item.clientHeight)
                            const _item: Element = tack[0]
                            console.log(_item);

                            const loopGet: (current:Element,str: keyof DOMRect) => { size:number,element:Element } = (current,str: keyof DOMRect) => {
                                let min = {
                                    element:current,
                                    size:current.getBoundingClientRect()[str] as number,
                                }
                                const innerLoop=(current:Element)=>{
                                    if(current instanceof HTMLHtmlElement){
                                        return min;
                                    }
                                    const width = (current.parentNode as Element).getBoundingClientRect()[str] as number;
                                    if(width<min.size){
                                        min = {
                                            element:(current.parentNode as Element),
                                            size:width
                                        }
                                    }
                                    innerLoop(current.parentNode as Element);
                                }
                                innerLoop(current);
                                return min
                            }


                            Object.defineProperty(entry.intersectionRect, 'width', {
                                configurable: true,
                                get(): number {
                                    //return target.getBoundingClientRect().width;
                                    //const width = target.getBoundingClientRect().width;
                                    //const _width = _item.getBoundingClientRect().width;
                                    //return _width < width ? _width : width
                                    return  loopGet(target,'width').size
                                }
                            })
                            Object.defineProperty(entry.intersectionRect, 'height', {
                                configurable: true,
                                get(): number {
                                    //const height = target.getBoundingClientRect().height;
                                    //const _height = _item.getBoundingClientRect().height;
                                    //return _height < height ? _height : height;
                                    return  loopGet(target,'height').size
                                }
                            })
                            Object.defineProperty(entry.intersectionRect, 'x', {
                                configurable: true,
                                get(): number {
                                    //const x = target.getBoundingClientRect().x;
                                    //const _x = _item.getBoundingClientRect().x;
                                    //return target.getBoundingClientRect().x;
                                    //return _x > x ? _x : x;
                                    const element = loopGet(target,'width').element;
                                    return element.getBoundingClientRect().x
                                }
                            })
                            Object.defineProperty(entry.intersectionRect, 'y', {
                                configurable: true,
                                get(): number {
                                    //const y = target.getBoundingClientRect().y;
                                    //const _y = _item.getBoundingClientRect().y;
                                    //return _y > y ? _y : y;
                                    const element = loopGet(target,'height').element;
                                    return element.getBoundingClientRect().y
                                }
                            })
                            this.callback(getEntries(this.vm), this)
                        }
                        console.log('intersectionRect', entry.intersectionRect);

                    })
                }
                if (['auto', 'scroll'].includes(styles.overflow)) {
                    tack.push(item);
                    addEventListener(item)
                }
                if (item instanceof HTMLHtmlElement && styles.overflow === 'visible') {
                    tack.push(item);
                    addEventListener(window)
                }
                loop(item.parentNode as Element)
            }
        }
        loop(target.parentNode as Element);
        this.resizeObserver.observe(target)
    }

    unobserve(target: Element): void {
        this.resizeObserver.unobserve(target);
        this.vm.delete(target)
    }
}


class PositionObserver {
    constructor(callback: PositionObserverCallback) {
        if (!(this instanceof PositionObserver)) {
            throw new TypeError('Cannot call a class as a function.');
        }
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        const controller = new PositionObserverSUP(callback);
        observers.set(this, controller)
    }

    disconnect(): void {
        return observers.get(this).disconnect()
    }

    observe(target: Element): void {
        return observers.get(this).observe(target)
    }

    unobserve(target: Element): void {
        return observers.get(this).unobserve(target)
    }
}

export default PositionObserver
