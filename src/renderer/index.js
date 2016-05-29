import Color from 'color';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import {constrain} from './utils';


class Image {
  constructor(width, height) {
    let canvas = this.canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext('2d');

    this.width = width;
    this.height = height;
  }

  setPixel(x, y, color) {
    this.ctx.fillStyle = color.hexString();
    this.ctx.fillRect(x, y, 1, 1);
  }
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      zoom: 1,
      image: new Image(8, 8),
      color: new Color('red')
    };
  }

  render() {
    let {zoom, image} = this.state;

    return (
      <div className="app">
        <Toolbox />
        <div className="main-panel">
          <Editor zoom={zoom} image={image} onClickArtboard={::this.handleClickArtboard}/>
          <StatusBar zoom={zoom} onChangeZoom={::this.handleChangeZoom} />
        </div>
      </div>
    );
  }

  handleChangeZoom(newZoom) {
    this.setState({
      zoom: constrain(1, newZoom, 24)
    });
  }

  handleClickArtboard(x, y) {
    let {image, color} = this.state;
    image.setPixel(x, y, color);
    this.setState({image: image});
  }
}


class Toolbox extends Component {
  render() {
    return (
      <div className="toolbox">
        <Tool name="pencil" />
      </div>
    );
  }
}


class Tool extends Component {
  render() {
    const {name} = this.props;
    return (
      <div className={`tool ${name}`}>{name}</div>
    );
  }
}


class Editor extends Component {
  render() {
    let {zoom, image, onClickArtboard} = this.props;

    return (
      <div className="editor">
        <Artboard zoom={zoom} image={image} onClick={onClickArtboard}/>
      </div>
    );
  }
}


class StatusBar extends Component {
  render() {
    let {zoom, onChangeZoom} = this.props;

    return (
      <div className="status-bar">
        <div className="filename">test.png</div>
        <ZoomControls min={1} max={24} step={1} value={zoom} onChange={onChangeZoom} />
      </div>
    );
  }
}


class ZoomControls extends Component {
  render() {
    let {max, min, step, value} = this.props;

    return (
      <div className="zoom">
        <button className="button zoom-out" onClick={::this.handleClickZoomOut}>-</button>
        <input
          className="zoom-input"
          type="range"
          max={max}
          min={min}
          value={value}
          step={step}
          onChange={::this.handleChangeZoom}
        />
        <button className="button zoom-in" onClick={::this.handleClickZoomIn}>+</button>
      </div>
    );
  }

  handleClickZoomOut() {
    let {onChange, step, min, value} = this.props;
    onChange(Math.max(value - step, min));
  }

  handleClickZoomIn() {
    let {onChange, step, max, value} = this.props;
    onChange(Math.min(value + step, max));
  }

  handleChangeZoom(event) {
    this.props.onChange(Number.parseInt(event.target.value));
  }
}


class Artboard extends Component {
  render() {
    return (
      <canvas
        ref="canvas"
        className="editor-canvas show-grid"
        onClick={::this.handleClick}
      />
    );
  }

  shouldComponentUpdate(nextProps) {
    let {zoom, image} = nextProps;
    this.drawImage(image, zoom);
    return false;
  }

  componentDidMount() {
    let {zoom, image} = this.props;
    this.drawImage(image, zoom);
  }

  drawImage(image, zoom) {
    let canvas = this.refs.canvas;
    let ctx = canvas.getContext('2d');

    canvas.width = image.width * zoom;
    canvas.height = image.height * zoom;
    ctx.scale(zoom, zoom);
    ctx.imageSmoothingEnabled = false;
    canvas.style.backgroundSize = `${zoom * 2}px`;

    ctx.drawImage(image.canvas, 0, 0);
  }

  handleClick(event) {
    let {onClick, zoom} = this.props;
    let rect = this.refs.canvas.getBoundingClientRect();
    let clickX = Math.floor((event.clientX - rect.left) / zoom);
    let clickY = Math.floor((event.clientY - rect.top) / zoom);
    onClick(clickX, clickY);
  }
}


// Start!
ReactDOM.render(
  <App />,
  document.querySelector('.app-container')
);
