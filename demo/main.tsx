import React from 'react';
import {createPortal} from 'react-dom';
import PositionObserver from "../src";

const vm = new WeakMap();

class Test extends React.PureComponent {

    state = {};
    ref = React.createRef<HTMLDivElement>();
    ref2 = React.createRef<HTMLDivElement>();

    /**
     *
     */
    componentDidMount() {
        const observe = new PositionObserver((entries) => {
            entries.map((entry) => {
                vm.set(entry.target, entry.boundingClientRect)
            });
            const boundingClientRect = vm.get(this.ref.current)
            this.setState({
                boundingClientRect,
            })
        })
        observe.observe(this.ref.current);
        /*const resizeObserver = new ResizeObserver((entries: any) => {
            console.log(entries);
        })
        resizeObserver.observe(this.ref.current);*/

        //resizeObserver.observe(this.ref2.current);
        setTimeout(() => {
            this.ref.current.style.height = '1000px';
        }, 2000)

    }

    /**
     *
     */
    render() {
        const boundingClientRect = this.state.boundingClientRect;
        console.log(boundingClientRect);
        return (
            <div style={{height: 800, width: 500, marginTop: 200, overflow: 'auto', border: '1px solid red'}}>
                <div ref={this.ref2}>123</div>
                <div id={'ww'} style={{overflow: 'scroll'}}>
                    <div ref={this.ref} style={{overflow: 'inherit', width: 300, border: '1px solid'}}>

                    </div>
                </div>
                {
                    boundingClientRect && createPortal(
                        <div style={{
                            position: 'fixed',
                            left:boundingClientRect.x,
                            top: boundingClientRect.y,
                            width:boundingClientRect.width-2,
                            height: boundingClientRect.height-2,
                            border:'1px solid'
                        }}>

                        </div>,
                        document.body)
                }

            </div>
        );
    }
}

/***
 *
 * @constructor
 */
export default function App(): React.ReactElement<HTMLElement> {
    return (
        <div className="app">
            <Test/>
        </div>
    )
}
