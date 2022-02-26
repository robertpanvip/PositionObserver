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
        const {boundingClientRect, intersectionRect, intersectionRatio, isIntersecting,tooltipRect} = this.state.entry;

        if (boundingClientRect && intersectionRect) {
           // console.log('intersectionRect',intersectionRect);
        }
        return (
            <div style={{height: 800, width: 500, marginTop: 200, overflow: 'auto', border: '1px solid red'}}>
                <div ref={this.ref2} style={{height: 0}}>123</div>
               {/* <div style={{overflow: 'scroll',height:600,width:200}}>
                    <div style={{height:200}}></div>

                </div>*/}
                <div id={'ww'} style={{overflow: 'scroll',position:'relative'}}>
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

                   {/* <div style={{
                        overflow: 'scroll',
                        position:'relative',
                        marginLeft: 100,
                        border: '1px solid red',
                        //height: 200,
                    }}>

                        <div style={{height:50}}>

                        </div>
                        <div style={{overflow: 'auto',whiteSpace: 'nowrap'}}>
                            <div
                                ref={this.ref}
                                id={'ge'}
                                style={{
                                    position:'absolute',
                                    overflow: 'inherit',
                                    //top:0,
                                    width: 300,
                                    height: 200,

                                    border: '1px solid green'
                                }}>
                                123
                            </div>
                            <div style={{width:200,height:250,display:'inline-block'}}>

                            </div>
                        </div>

                    </div>*/}
                </div>
                {
                    boundingClientRect && intersectionRect &&createPortal(
                        <div
                            style={{
                                position: 'fixed',
                                left: tooltipRect.left,
                                top: tooltipRect.top,
                                height: tooltipRect.height,
                                width: tooltipRect.width,
                                border: '1px solid yellow',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: 200,
                                    height: 50,
                                    border: '1px solid red',
                                    marginTop:boundingClientRect.top-intersectionRect.top,
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
