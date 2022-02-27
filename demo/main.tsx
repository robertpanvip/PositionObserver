import React from 'react';
import {createPortal} from 'react-dom';
import PositionObserver from "../src";
import {IntersectionRect} from "../src/PositionObserver";

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
            const entry = vm.get(this.ref.current);

            //console.log(entry);
            this.setState({
                entry
            })
        },{
            targetMargin:[50,200,0,0]
        })
        observe.observe(this.ref.current);
        setTimeout(() => {
            this.ref.current.style.height = '1250px';
        }, 2000)



    }

    /**
     *
     */
    render() {
        const {boundingClientRect, intersectionRect, intersectionRatio, isIntersecting,tooltipRect,parentIntersectionRect} = this.state.entry;

        if (boundingClientRect && intersectionRect) {
            // console.log('intersectionRect',intersectionRect);
        }
        return (
            <div style={{height: 800, width:317, marginTop: 100,marginLeft:100, overflow: 'auto', border: '1px solid pink'}}>
            <div id={'wrapper'} style={{height: 800, width: 500, marginTop: 200, overflow: 'auto', border: '1px solid red'}}>
                <div ref={this.ref2} style={{height: 0}}>123</div>
                <div id={'ww'} style={{overflow: 'scroll',position:'relative',width:1200}}>
                    <div style={{height:1000}}>

                    </div>
                    <div
                        ref={this.ref}
                        id={'ge'}
                        style={{
                            overflow: 'inherit',
                            //top:0,
                            width: 300,
                            height: 200,

                            border: '1px solid green'
                        }}>
                        123
                    </div>
                </div>

            </div>
                <div style={{height:800}}></div>
                {
                    boundingClientRect && intersectionRect &&createPortal(
                        <div
                            style={{
                                position: 'fixed',
                                left: tooltipRect.left,
                                top: tooltipRect.top,
                                height: tooltipRect.height,
                                width: tooltipRect.width,
                                //border: '1px solid yellow',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    position: 'fixed',
                                    left: intersectionRect.left,
                                    top: intersectionRect.top,
                                    height: intersectionRect.height-17,
                                    width: intersectionRect.width-17,
                                    border: '1px solid black',
                                    overflow: 'hidden',
                                }}
                            ></div>
                            <div
                                style={{
                                    position: 'fixed',
                                    left: parentIntersectionRect.left,
                                    top: parentIntersectionRect.top,
                                    height: parentIntersectionRect.height-17,
                                    width: parentIntersectionRect.width-17,
                                    border: '1px solid yellow',
                                    overflow: 'hidden',
                                }}
                            ></div>
                            <div
                                style={{
                                    //width: 200,
                                    height: 48,
                                    border: '1px solid red',
                                    marginTop:(parentIntersectionRect.bottom-tooltipRect.top)<=50?0:(tooltipRect.height-50),
                                    marginLeft:(tooltipRect.width-199),
                                }}
                            >
                                12345678
                            </div>
                        </div>,
                        document.body
                    )
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
