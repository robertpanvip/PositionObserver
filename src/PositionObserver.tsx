interface PositionObserverCallback {
    (entries: PositionObserverEntry[], observer: PositionObserver): void;
}

function getEntries(map: Map<Element, PositionObserverEntry>) {
    const entries: PositionObserverEntry[] = [];
    map.forEach(item => {
        entries.push(item)
    })
    return entries;
}

const observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new Map();

class PositionObserverEntry {
    readonly boundingClientRect: DOMRectReadOnly;
    readonly target: Element;

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
    private vm = new Map();
    private resizeObserver: ResizeObserver;

    constructor(callback: PositionObserverCallback) {
        this.callback = callback;
        this.resizeObserver = new ResizeObserver(() => {
            this.callback(getEntries(this.vm), this)
        })
    }

    disconnect(): void {
        this.resizeObserver.disconnect();
        this.vm.clear();
    }

    observe(target: Element): void {
        const entry = new PositionObserverEntry(target)
        this.vm.set(target, entry)

        const loop = (item: Element) => {
            if (item.parentNode) {
                const styles = getComputedStyle(item);
                const addEventListener = (item: Element | Window) => {
                    item.addEventListener('scroll', () => {
                        this.callback(getEntries(this.vm), this)
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
