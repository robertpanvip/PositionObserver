import React from 'react';
import {createPortal} from 'react-dom';
import PositionObserver from "../src";

const vm = new WeakMap();

class Test extends React.Component {

    state: any = {entry: {}};
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
        setTimeout(() => {
            this.ref.current.style.height = '1000px';
        }, 2000)

    }

    /**
     *
     */
    render() {
        const {boundingClientRect, intersectionRect, intersectionRatio, isIntersecting} = this.state.entry;

        if (boundingClientRect && intersectionRect) {
            console.log('width', intersectionRect, intersectionRect?.width);
            console.log(intersectionRatio, isIntersecting);
        }
        return (
            <div style={{height: 800, width: 500, marginTop: 200, overflow: 'auto', border: '1px solid red'}}>
                <div ref={this.ref2} style={{height: 900}}>123</div>
                {/*<div style={{overflow: 'scroll',height:600,width:200}}>
                    <div style={{height:200}}></div>

                </div>*/}
                <div id={'ww'} style={{overflow: 'scroll'}}>
                    <div ref={this.ref}
                         style={{overflow: 'inherit', width: 300, height: 200, marginLeft: 100, border: '1px solid'}}>
                    123
                    </div>
                </div>
                {
                    boundingClientRect && intersectionRect && createPortal(
                        <div style={{
                            position: 'fixed',
                            left: intersectionRect.x,
                            top: intersectionRect.y,
                            width: intersectionRect.width,
                            height: intersectionRect.height,
                            border: '1px solid yellow',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: boundingClientRect.width,
                                height: boundingClientRect.height,
                                border: '1px solid red'
                            }}>
                                456
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
