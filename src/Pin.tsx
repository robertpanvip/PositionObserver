import React, {useEffect, useRef} from 'react';
import Handlers from 'handler-fragment'
import PositionObserver from './PositionObserver';
import {createPortal} from 'react-dom';

interface PinProps {
    children: React.ReactElement,
    content: React.ReactNode,
}

const vm = new WeakMap();

function Pin({children, content}: PinProps) {
    const ref = useRef(null);
    const pin = useRef(null);
    useEffect(() => {

        if (!ref.current) {
            return;
        }

        const observer = new PositionObserver((entries) => {
            entries.map((entry) => {
                vm.set(entry.target, entry)
            });
            const entry = vm.get(ref.current);
            const {tooltipRect, intersectionRect, parentIntersectionRect} = entry;

            pin.current.style.left = tooltipRect.left + 'px';
            pin.current.style.top = tooltipRect.top + 'px';
            pin.current.style.height = tooltipRect.height + 'px';
            pin.current.style.width = tooltipRect.width + 'px';

        }, {targetMargin: [50, 200, 0, 0]});

        observer.observe(ref.current)

        return () => {
            observer.unobserve(ref.current)
        }
    }, [])

    return (
        <>
            <Handlers ref={ref}>
                {children}
            </Handlers>
            {
                createPortal((
                    <div ref={pin} style={{position: 'fixed', overflow: 'hidden'}}>
                        {content}
                    </div>
                ), document.body)
            }
        </>

    )

}

export default Pin;
