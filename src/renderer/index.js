import Color from 'color';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import {constrain} from './utils';


class Image {
  constructor(width, height) {
    let canvas = this.canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    this.width = width;
    this.height = height;
  }
}


class Pencil {
  handleClick(x, y, image, color) {
    let ctx = image.canvas.getContext('2d');
    ctx.fillStyle = color.hexString();
    ctx.fillRect(x, y, 1, 1);
  }
}


class Eraser {
  handleClick(x, y, image) {
    let ctx = image.canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'blue';
    ctx.fillRect(x, y, 1, 1);
  }
}


class App extends Component {
  constructor(props) {
    super(props);

    this.tools = {
      pencil: new Pencil(),
      eraser: new Eraser()
    };

    this.state = {
      zoom: 1,
      image: new Image(8, 8),
      currentTool: 'pencil',
      color: new Color('red')
    };
  }

  render() {
    let {zoom, image, currentTool} = this.state;

    return (
      <div className="app">
        <Toolbox
          currentTool={currentTool}
          tools={this.tools}
          onClickTool={::this.handleClickTool}
        />
        <div className="main-panel">
          <Editor zoom={zoom} image={image} onClickArtboard={::this.handleClickArtboard}/>
          <StatusBar zoom={zoom} onChangeZoom={::this.handleChangeZoom} />
        </div>
      </div>
    );
  }

  handleClickTool(toolName) {
    this.setState({
      currentTool: toolName
    });
  }

  handleChangeZoom(newZoom) {
    this.setState({
      zoom: constrain(1, newZoom, 24)
    });
  }

  handleClickArtboard(x, y) {
    let {image, color, currentTool} = this.state;
    let tool = this.tools[currentTool];
    tool.handleClick(x, y, image, color);
    this.setState({image: image});
  }
}


class Toolbox extends Component {
  render() {
    let {tools, currentTool, onClickTool} = this.props;

    let toolTags = [];
    for (let toolName in tools) {
      toolTags.push(
        <ToolButton
          key={toolName}
          name={toolName}
          selected={toolName == currentTool}
          onClick={onClickTool}
        />
      );
    }

    return (
      <div className="toolbox" refs="toolbox">
        {toolTags}
      </div>
    );
  }

  onComponentDidUpdate() {
    this.refs.toolbox.querySelector(this.props.currentTool);
  }
}


class ToolButton extends Component {
  render() {
    const {name, selected} = this.props;
    return (
      <div className={`tool ${name} ${selected && 'selected'}`} onClick={::this.handleClick}>
        {name}
      </div>
    );
  }

  handleClick() {
    let {name, onClick} = this.props;
    onClick(name);
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
