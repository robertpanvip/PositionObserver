import React from 'react';
import {createPortal} from 'react-dom';
import PositionObserver from "../src";

const vm = new WeakMap();

class Test extends React.Component {

    state = {entry:{}};
    ref = React.createRef<HTMLDivElement>();
    ref2 = React.createRef<HTMLDivElement>();

    /**
     *
     */
    componentDidMount() {
        const observe = new PositionObserver((entries) => {
            entries.map((entry) => {
                vm.set(entry.target, entry)
            });
            const entry = vm.get(this.ref.current)
            //console.log(entry);
            this.setState({
                entry
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
        const {boundingClientRect,intersectionRect} = this.state.entry;

        if(boundingClientRect && intersectionRect){
            console.log('width',intersectionRect,intersectionRect?.width);
        }
        return (
            <div style={{height: 800, width: 500, marginTop: 200, overflow: 'auto', border: '1px solid red'}}>
                <div ref={this.ref2} style={{height:900}}>123</div>
                <div id={'ww'} style={{overflow: 'scroll'}}>
                    <div ref={this.ref} style={{overflow: 'inherit', width: 300, border: '1px solid'}}>

                    </div>
                </div>
                {
                    boundingClientRect && intersectionRect && createPortal(
                        <div style={{
                            position: 'fixed',
                            left:intersectionRect.x,
                            top: intersectionRect.y,
                            width:intersectionRect.width-2,
                            height: intersectionRect.height-2,
                            border:'1px solid yellow',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width:boundingClientRect.width-2,
                                height: boundingClientRect.height-2,
                                border:'1px solid red'
                            }}>

                            </div>
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
