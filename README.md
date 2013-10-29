#LX-PDF

Beispiel zur Verwendung von lx-pdf mit einer Template Datei

    var lxDocument = require('lx-pdf.js')('template.json');

    // Add text to Document section 'content'
    var text = '<some text>';
    lxDocument.addContent('content', text);

    // Add more text another stuff to document
    ...

    // Save document to local storage
    lxDocument.save('document.pdf', function(result) {
      // If result NULL then success otherwise it hold error informationen
    });

## Aufbau eines Templates

Beispiel Template für ein Dokument im JSON Format. Das Layout sowie die Sektionen gelten immer für eine Seite. Die letzte Seite wird dann für die darauffolgenden wiederholt.

    {
      "options" : {
        "pages": [
        {
          "layout"    : {
            ... // Seitenlayout
          },
          "background": {
            ... // Seitenhintergrund
          },
          "sections": {
            "content": {
              ... // Sektion "CONTENT" für die Seite
            }
            ...
          }
        }
        ...
        ]
      }
    }

####  Layout

Das Layout beschreibt die Größe sowie die Ausrichtung der Seite.

    "layout"    : {
      "size"   : "A4", // DIN Format
      "layout" : "portrait", // Ausrichtung portait|landscape
      "margins": {
        "top"   : 0,
        "left"  : 0,
        "bottom": 0,
        "right" : 0
      }
	}

#### Hintergrund

Als Hintgrund kann ein Bild verwendet werden. Ideal für Briefvorlagen.

    "background": {
        "filename"   : "./image/background.png",
        "imageformat": {
	        "fit": [595.28, 841.89]
    	}
    }

#### Sektionen

Die Sektion beschreibt ein Element auf der Seite, mit Größe, Ausrichtung, Schriftart und Schriftgröße.

    "content": { // Sektionsname
      "font"  : {
          "name" : "./fonts/arial.ttf", // Dateiname
          "size" : 12,
          "color": "#000000"
      },
      "format": {
          "align" : "justify", // left|right|justify
          "left"  : 70,
          "top"   : 670,
          "width" : 481,
          "height": 70
      }
    }

## Arbeiten mit Sektionen

#### Tabellen

Darstellung einer Tabelle mit drei Spalten, sowie Kopfbezeichnung.

		// The table header
        var tableHeader = [
            {
                text: 'Column 1',
                width: 160,
                align: 'left',
                font: {
                    name : './fonts/arialbd.ttf',
                    size : 12,
                    color: '#000000'
                }
            },
            {
            	text: 'Column 2',
                width: 161,
                align: 'left',
                font: {
                	name : './fonts/arialbd.ttf',
                    size : 12,
                    color: '#000000'
                }
            },
            {
            	text: 'Column 3',
                width: 160,
                align: 'right',
                font: {
                	name : './fonts/arialbd.ttf',
                    size : 12,
                    color: '#000000'
                }
            }
        ];

        // The table content
        var tableData = [
            // Simple Row
            ['Cell A1', 'Cell B1', 'Cell C1'],
            // Simple Row with empty text
            ['Cell A2', '', 'Cell C2'],
            // A Row with Styling in CELL B6
            ['Cell A6', {text: 'Cell B6', align: 'right', font: {color: '#FF00FF'}}, 'Cell C6'],
            // Draw a row with border lines. Option "linemode" says, use border for every next cell in this line
            [
            	{
                	text: 'Cell A8',
                    border: {
                    	color: '#000000',
                        style: 'normal',
                        position: ['bottom', 'top'],
                        linemode: true
                    }
                },
                'Cell B8',
                'Cell C8'
            ],
            // A Cell with different font and double line
            [
            	'',
                '',
                {
                	text: 'Cell C9',
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
        ];

		// Add table to document
		lxDocument.addTable('content', tableData, tableHeader);

#### Zellenformatierung

Pro Zelle sind verschiedene Formatierungen möglich. Diese können dann auch Zeilenweit gesetzt werden.

	var cellFormat = {
    	text: 'My Text', // Text to display
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