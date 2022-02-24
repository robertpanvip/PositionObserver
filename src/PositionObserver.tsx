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

class IntersectionRect {
    readonly bottom: number;
    readonly height: number;
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly width: number;
    readonly x: number;
    readonly y: number;

    constructor(left: number, top: number, width: number, height: number) {
        this.left = left;
        this.top = top;
        this.right = left + width;
        this.bottom = top + height;
        this.width = width;
        this.height = height;
        this.x = left;
        this.y = top;
    }

    toJSON() {
        return JSON.stringify(this)
    }
}

class PositionObserverEntry {
    /** 目标元素的矩形信息 **/
    readonly boundingClientRect: DOMRectReadOnly;
    /** 目标元素 **/
    readonly target: Element;
    /** 相交区域和目标元素的比例值 **/
    readonly intersectionRatio: number;
    /** 目标元素和视窗（根）相交的矩形信息 可以称为相交区域 **/
    intersectionRect: IntersectionRect;
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

/**
 * 循环获取可见视口
 * @param target
 * @param targetRect
 */
function loopGetRect(target: Element, targetRect: DOMRect): DOMRect {
    const parent = target.parentNode as Element;
    const parentRect = parent.getBoundingClientRect();
    const ViewReact = {
        left: parentRect.left,
        top: parentRect.top,
        width: parentRect.width,
        height: parentRect.height,
    }
    const left = Math.max(ViewReact.left, targetRect.left);
    const top = Math.max(ViewReact.top, targetRect.top);
    //pre https://blog.csdn.net/weixin_43395911/article/details/104955302?utm_medium=distribute.pc_relevant.none-task-blog-2~default~baidujs_title~default-1.queryctrv2&spm=1001.2101.3001.4242.2&utm_relevant_index=4
    const _h = Math.min(targetRect.top + targetRect.height, ViewReact.top + ViewReact.height) - Math.max(targetRect.top, ViewReact.top)
    const _w = Math.min(targetRect.left + targetRect.width, ViewReact.left + ViewReact.width) - Math.max(targetRect.left, ViewReact.left)
    const width = _w >= 0 ? _w : 0;
    const height = _h >= 0 ? _h : 0;

    const intersectionRect = new IntersectionRect(left, top, width, height)

    if (!(parent.parentNode instanceof HTMLHtmlElement)) {
        return loopGetRect(parent, intersectionRect)
    } else {
        return intersectionRect
    }
}

class PositionObserverSUP {
    private readonly callback: PositionObserverCallback;
    private vm = new Map<Element, PositionObserverEntry>();
    // @ts-ignore
    private resizeObserver: ResizeObserver;

    constructor(callback: PositionObserverCallback) {
        this.callback = callback;
        // @ts-ignore
        this.resizeObserver = ResizeObserver && new ResizeObserver(() => {
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
                    ele.addEventListener('scroll', () => {
                        entry.intersectionRect = loopGetRect(target, target.getBoundingClientRect());
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
