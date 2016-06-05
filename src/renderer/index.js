import fs from 'fs';

import {remote} from 'electron';

import Color from 'color';
import mime from 'mime-types';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import {constrain} from './utils';


const {app, dialog, Menu} = remote;


Menu.setApplicationMenu(Menu.buildFromTemplate([
  {
    label: 'Picoart',
    submenu: [
      {
        label: 'Reload Window',
        accelerator: 'Command+R',
        click(item, focusedWindow) {
          focusedWindow.webContents.reload();
        }
      },
      {
        label: 'Open DevTools',
        accelerator: 'Command+K',
        click(item, focusedWindow) {
          focusedWindow.webContents.toggleDevTools();
        }
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open...',
        accelerator: 'Command+O',
        async click() {
          let paths = dialog.showOpenDialog({
            title: 'Open Image',
            properties: ['openFile']
          });

          if (!paths) {
            return;
          }

          try {
            reactApp.setState({image: await Image.fromFile(paths[0])});
          } catch (err) {
            alert(`Failed to open file: ${err}`);
          }
        }
      },
      {
        label: 'Save',
        accelerator: 'Command+S',
        click() {
          try {
            reactApp.saveImage();
          } catch (err) {
            alert(`Failed to save file: ${err}`);
          }
        }
      },
      {
        label: 'Save As...',
        accelerator: 'Shift+Command+S',
        click() {
          let path = dialog.showSaveDialog({
            title: 'Save Image',
            properties: ['openFile']
          });

          if (!path) {
            return;
          }

          try {
            reactApp.saveImageAs(path);
          } catch (err) {
            alert(`Failed to save file: ${err}`);
          }
        }
      }
    ]
  }
]));


class Image {
  DATA_URI_REGEX = /^data:.+;base64,(.*)$/;

  constructor(width, height, filename='untitled') {
    this.filename = filename;

    let canvas = this.canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    this.width = width;
    this.height = height;
  }

  save() {
    if (!this.filename) {
      alert('Cannot save unnamed file without specifying path.');
      return;
    }

    return this.saveAs(this.filename);
  }

  saveAs(path) {
    try {
      let mimetype = mime.lookup(path);
      if (!mimetype) {
        alert(`Could not save file ${path}: Unrecognized format.`);
        return;
      }

      let dataUrl = this.canvas.toDataURL(mimetype);
      let base64Data = dataUrl.match(this.DATA_URI_REGEX)[1];
      let buffer = new Buffer(base64Data, 'base64');
      fs.writeFileSync(path, buffer);
    } catch (err) {
      alert(`Could not save file ${path}: ${err}`);
    }
  }

  static fromFile(filename) {
    return new Promise((resolve) => {
      let imgTag = document.createElement('img');
      imgTag.onload = function() {
        let image = new Image(imgTag.width, imgTag.height, filename);
        let ctx = image.canvas.getContext('2d');
        ctx.drawImage(imgTag, 0, 0);
        resolve(image);
      };
      imgTag.src = `file://${filename}`;
    });
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
    let {zoom, image, currentTool, color} = this.state;

    return (
      <div className="app">
        <Toolbox
          currentTool={currentTool}
          tools={this.tools}
          onClickTool={::this.handleClickTool}
          onChangeColor={::this.handleChangeColor}
          currentColor={color.hexString()}
        />
        <div className="main-panel">
          <Editor zoom={zoom} image={image} onClickArtboard={::this.handleClickArtboard}/>
          <StatusBar
            zoom={zoom}
            onChangeZoom={::this.handleChangeZoom}
            filename={image.filename}
          />
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

  handleChangeColor(newColor) {
    this.setState({color: new Color(newColor)});
  }

  handleClickArtboard(x, y) {
    let {image, color, currentTool} = this.state;
    let tool = this.tools[currentTool];
    tool.handleClick(x, y, image, color);
    this.setState({image: image});
  }

  saveImage() {
    let {image} = this.state;
    image.save();
  }

  saveImageAs(path) {
    let {image} = this.state;
    image.saveAs(path);
  }
}


class Toolbox extends Component {
  render() {
    let {tools, currentTool, onClickTool, currentColor} = this.props;

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
        <ColorPicker onChange={this.props.onChangeColor} value={currentColor} />
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


class ColorPicker extends Component {
  render() {
    let {value} = this.props;

    return (
      <input type="color" onChange={::this.handleChange} value={value} />
    );
  }

  handleChange(event) {
    this.props.onChange(event.target.value);
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
    let {zoom, onChangeZoom, filename} = this.props;

    return (
      <div className="status-bar">
        <div className="filename">{filename}</div>
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
        className="artboard"
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
let reactApp = ReactDOM.render(
  <App />,
  document.querySelector('.app-container')
);
