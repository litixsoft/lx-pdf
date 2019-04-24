    Project is deprecated. No continue development, no bugfixing anymore.
---

# lx-pdf [![Build Status](https://travis-ci.org/litixsoft/lx-pdf.png?branch=master)](https://travis-ci.org/litixsoft/lx-pdf) [![david-dm](https://david-dm.org/litixsoft/lx-pdf.png)](https://david-dm.org/litixsoft/lx-pdf/) [![david-dm](https://david-dm.org/litixsoft/lx-pdf/dev-status.png)](https://david-dm.org/litixsoft/lx-pdf#info=devDependencies&view=table)

>Easy to use template-based pdf document generator in node.js.

## Install:

[![NPM](https://nodei.co/npm/lx-pdf.png??downloads=true&stars=true)](https://nodei.co/npm/lx-pdf/)

## Usage
Usage with template file.

```js
var lxDocument = require('lx-pdf')('template.json');

// Add text to Document section 'content'
var text = '<some text>';
lxDocument.addContent('content', text);

// Add more text another stuff to document
...

// Save document to local storage
lxDocument.save('document.pdf', function(result) {
  // If result NULL then success otherwise it hold error informationen
});
```

### Structure of a template
A sample document template in JSON. A Page Layout and there sections defined for one page only. If no following page definied then the last page is repeated.

```js
{
	"fonts": { ... }, // Font templates
    "header": { // see Page Header and Footer
    	"font": { ... },
        "format": { ... },
        "data": [ ... ]
    },
	"footer": { // see Page Header and Footer
    	"font": { ... },
        "format": { ... },
        "data": [ ... ]
    },
    "options": {
        "pages": [ // Page setup
            {
                "layout": {
                    ... // see Layout
                },
                "background": {
                    ... // see Background
                },
                "sections": {
                    "content": {
                        ... // Section "CONTENT"
                    }
                }
            }
        ]
    }
}
```

#### Layout
A layout describes the size and the orientation.

```js
{
    "layout": {
        "size": "A4", // DIN Format
        "header": false, // Turns OFF defined header area, default is turned on
        "footer": false, // Turns OFF defined footer area, default is turned on
        "layout": "portrait", // Orientation portait|landscape
        "margins": {
            "top": 0,
            "left": 0,
            "bottom": 0,
            "right": 0
        }
	}
}
```

#### Background
You can use a image as background. Perfect for letter templates.
Supported image formats: .PNG and .JPEG.

```js
{
    "background": {
        "filename": "./image/background.png",
        "imageformat": {
	        "fit": [595.28, 841.89]
    	}
    }
}
```
#### Image or Multiple Images
You can use a image or multiple images by specifying the position of the image in template. Perfect for letter templates.
Supported image formats: .PNG and .JPEG.

```js
{
    "multipleImage": [{
        "filename": "./image/Image1.png",
        "imageformat": {
	        "fit": [50, 50]
    	},
    	"position": {
    	    "left": "50",
    	    "top": "50"
    	}
    },
    {
      "filename": "./image/Image2.png",
              "imageformat": {
      	        "fit": [50, 50]
          	},
          	"position": {
          	    "left": "110",
          	    "top": "50"
          	}
    }
    ]
}
```

#### Font and Format

The font object
```js
	"font": {
        "name": "./fonts/arial.ttf", // True Type Font
        "size": 12, // Size
        "color": "#000000" // Color
    }
```

The format object
```js
    "format": {
        "align": "justify", // Text Alignment left|right|justify
        "left": 70,
        "top": 670,
        "width": 481,
        "height": 70,
        "textmargin": {
        	"left": 5,
            "top": 5,
            "right": 5,
            "bottom": 5
        }
    }
```

For better handling your can define font templates.
```js
{
	"fonts", {
    	"default": { ... }, // Default font, used if no font definied
        "body": {
        	"name": "./fonts/arialbd.ttf"
            "size": 10,
            "color": "#000000"
        }
    }
}
```

#### Page Header and Footer
Define your pageheader and footer.

```js
{
  ...
  "header": {
    "font": { ... },
    "format": { ... }, // HINT: left, top, right value will be ignored
    "data": [ ... ]
  }
  "footer"  : {
    "font": { ... },
    "format": { ... }, // HINT: left, top, right value will be ignored
    "data": [ ... ]
  }
  ...
}
```

#### Sections
A section defined a area of the page. You can usage size, orientation, fontstyle, fontsize, aligment.

```js
{
    "content": { // Sectionname
    	"text": "",  // Default text or table object. There will be always showed.
        "font": "body", // Defined font template name, or font object
        "format": {
            "align": "justify", // left|right|justify
            "left": 70,
            "top": 670,
            "width": 481,
            "height": 70
        }
    }
}
```

### Working with sections
#### Tables
Display table with four columns and a head row.

```js
{// The table header
var tableHeader = [
    {
        text: 'Column 1',
        width: 160,
        align: 'left',
        font: {
            name: './fonts/arialbd.ttf',
            size: 12,
            color: '#000000'
        }
    },
    {	// No cellwidth defined for this column, there will be auto calculated later
    	text: 'Column 2',
        align: 'left',
        font: {
        	name: './fonts/arialbd.ttf',
            size: 12,
            color: '#000000'
        }
    },
    {
    	text: 'Column 3',
        width: 160,
        align: 'right',
        font: {
        	name: './fonts/arialbd.ttf',
            size: 12,
            color: '#000000'
        }
    }
    {	// No cellwidth, there will be defined in the data section
    	text: 'Column 4',
        align: 'right',
        font: {
        	name: './fonts/arialbd.ttf',
            size: 12,
            color: '#000000'
        }
    }
];

// The table content
var tableData = [
    // Simple Row
    ['Cell A1', 'Cell B1', 'Cell C1', 'Cell D1'],

    // Simple Row with empty text and missing cell D2
    ['Cell A2', '', 'Cell C2'],

    // A Row with Styling in CELL B3
    ['Cell A3', {text: 'Cell B3', align: 'right', font: {color: '#FF00FF'}}, 'Cell C3', 'Cell D3'],

    // Draw a row with border lines. Option "linemode" says, use border for every next cell in this line
    [
    	{
        	text: 'Cell A4',
            border: {
            	color: '#000000',
                style: 'normal',
                position: ['bottom', 'top'],
                linemode: true
            }
        },
        'Cell B4',
        'Cell C4',
        'Cell D4'
    ],

    // A Cell with different font and double line
    [
    	'',
        '',
        {
        	text: 'Cell C5',
            align: 'right',
            font: {
            	name : './fonts/arialbd.ttf'},
                border: {
                	color: '#000000',
                    style: 'double',
                    position: ['bottom']
                }
            }
        }
    ],

	// Define cellwidth in Cell D6, this is applied to the entire column.
    [
    	'Cell A6',
        'Cell B6',
        'Cell C6',
        {
        	text: 'Cell D6',
            width: 120
        }
    ],

    // Sample Colspan over two Cells B7-B8
    [
    	'Cell A7',
        {
        	text: 'Cell B7 and C7',
            colspan: 2
        },
        'Cell D7'
    ]
];

// Add table to document
lxDocument.addTable('content', tableData, tableHeader);
```

#### Cellformats

Per cell you can defined different formats, but you can also describe it per row.

```js
var cellFormat = {
	text: 'My Text', // Text to display
    colspan: 2,  // Link cells
    align: 'right', // Textalignment (default: left)
    font: {
    	name: './fonts/arialbd.ttf', // Fontname
        size: 12, // Fontsize
        color: '#000000', // Fontcolor (default: #000000)
    },
    border: {
    	color: '#000000', // Bordercolor (default: #000000)
        style: 'normal', // Borderstyle normal|double (default: normal)
        linemode: true, // Use format for next cells (default: false)
        linewidth: 1, // The linewidth, only for style 'normal'
        position: ['left', 'top', 'right', 'bottom'] // Border left|top|right|bottom
    }
}
```

### lx-pdf Api

Loads a template object.
```js
loadTemplate(templateobject);
```

Reset document.
```js
sut.clear();
```

Add text or table object to current page.
```js
sut.addContent(sectionname, sectiondata)
```

Adds a picture
```js
sut.addImage(sectionname, imagefilename, [options])
```

###### Options

* __width__: Width in pixels. If only the width specified, then the height calculated, to maintain the aspect ratio
* __height__: Height in pixels. If only the height specified, then the width calculated, to maintain the aspect ratio

Performs a manual pagebreak.
```js
sut.addPageBreak();
```

Reset document, keep all data and start with page 1. Batch Job.
```js
sut.resetDocumentIndices();
```

Saves the document as pdf file to storage. If (error) is undefined then success.
```js
save(filename, function(error) {
	...
});
```

Returns document as string (data). If (data) is null, (error) holds error informations.
```js
print(function(data, error) {
	...
})
```

## Contributing
In line of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](http://gruntjs.com/).

## Release History
### v0.1.3 project initial
- Bugfixes

### v0.1.2 project initial
- Bugfixes

### v0.1.0 project initial

## Author
[Litixsoft GmbH](http://www.litixsoft.de)

## License
Copyright (C) 2013-2016 Litixsoft GmbH <info@litixsoft.de>
Licensed under the MIT license.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
