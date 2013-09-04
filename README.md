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
            "list": {
              ... // Sektion "LIST" für die Seite
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
        "filename"   : "background.png",
        "imageformat": {
	        "fit": [595.28, 841.89]
    	}
    }

#### Sektionen

Die Sektion beschreibt ein Element auf der Seite, mit Größe, Ausrichtung, Schriftart und Schriftgröße.

    "content": { // Sektionsname
      "font"  : {
          "name" : "arial.ttf", // Dateiname
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