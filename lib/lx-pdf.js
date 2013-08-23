'use strict';

var PDFDocument = require('pdfkit'),
    lxHelpers = require('lx-helpers'),
    filestream = require('fs');

module.exports = function () {
    var pub = {},
        pageIndex = 0,
        documentData = {},
        documentTemplateData = {},
        showTextboxes = false;

    /*
        Returns the value from DATA with KEYNAME. If KEYNAME not exist in DATA, then returns DEFAULTVALUE.
     */
    function getValue(keyname, defaultvalue, data) {
        var keys = keyname.split('.');

        defaultvalue = (typeof defaultvalue === 'undefined' ? undefined : defaultvalue);
        data = data || documentTemplateData;

        for (var key in keys) {
            if (keys.hasOwnProperty(key)) {
                // Has Key a Page Array, take the current Page from Page Index
                if (data.pages && getIsArray(data.pages)) {
                    data = data.pages;

                    // Returns only the data field for the current Site
                    // If pageIndex greater than available Items, take the last Entry
                    if (data.length > pageIndex) {
                        data = data[pageIndex];
                    } else {
                        data = data[data.length - 1];
                    }
                }

                // Key does not exist, return defaultvalue
                if (! data[keys[key]]) {
                    return defaultvalue;
                }

                data = data[keys[key]];
            }
        }

        // Return data
        return data;
    }

    /**
     * Returns if KEYNAME in DATA exists.
     *
     * @param keyname
     * @param data
     * @returns {boolean}
     */
    function getKeyExist(keyname, data) {
        data = data || undefined;
        return getValue(keyname, undefined, data) !== undefined;
    }

    /*
        Returns if WHAT is a array
     */
    function getIsArray(what) {
        return Object.prototype.toString.call(what) === '[object Array]';
    }

    /**
     * Returns the maximal height of TEXT with the current font
     *
     * @param text
     * @param maxWidth
     * @returns {number}
     */
//    function getTextHeight(text, maxWidth) {
//        if (!text) {
//            return 0;
//        }
//
//        var textList = text.split('\n'),
//            textWidth,
//            wrapLines = 0;
//
//        for (var textItem in textList) {
//            if (textList.hasOwnProperty(textItem)) {
//                textWidth = Math.ceil(pdfDocument.widthOfString(textList[textItem]));
//
//                if (textWidth > maxWidth) {
//                    wrapLines += Math.round(textWidth / maxWidth);
//                }
//            }
//        }
//
//        return parseInt(textItem, 10) + 1 + parseInt(wrapLines, 10);
//    }

    /**
     * Setup the current Page
     *
     * @param document
     */
    function setUpPage(document) {
        var pageBackgroundOptions = getValue('options.background');

        // sets the background image
        if (pageBackgroundOptions && getKeyExist('filename', pageBackgroundOptions)) {
            document.image(getValue('filename', undefined, pageBackgroundOptions), 0, 0, getValue('imageformat', {}, pageBackgroundOptions));
        }
    }

    /**
     * Set the page at INDEX as the actually page. If page doesent exits the creates it.
     *
     * @param document
     * @param index
     */
    function setPage(document, index) {
        // if page doesent exits then create all page includes the required page
        if (index >= document.pages.length) {
            while (true) {
                pageIndex = document.pages.length; // TODO: Dummy for getValue REPLACE IT
                var currentPageSettings = getValue('options.layout', {});

                // create page
                document.addPage(currentPageSettings);
                setUpPage(document);

                // No comment
                if (document.pages.length > index) {
                    break;
                }
            }
        }

        // Set Page
        pageIndex = index;
        document.page = document.pages[index];
    }

    /*
     Adds content TEXT to SECTIONNAME on the current page
     */
    function addContentToDocument(document, sectionName, sectionInfo) {
        // Get some informations
        var contentFormat = getValue('options.sections.' + sectionName, {});

        // If section not defined then exit
        if (!contentFormat) {
            console.log('WARNING: Section "' + sectionName + '" not found.');
            return {done: true, error: true};
        }

        var text = sectionInfo.data || undefined,
            left = getValue('format.left', 0, contentFormat),
            top = getValue('format.top', 0, contentFormat),
            height = getValue('format.height', 0, contentFormat),
            width = getValue('format.width', 0, contentFormat),
            format = getValue('format', {}, contentFormat),
            fontname = getValue('font.name', 'Helvetica', contentFormat),
            fontsize = getValue('font.size', 10, contentFormat),
            fontcolor = getValue('font.color', '#000000', contentFormat),
            pixelWidth = width * 2.0,
            result = {
                done: true,
                error: false,
                data: text,
                lineIndex: sectionInfo.lineIndex || 1,
                pageIndex: pageIndex
            };

        if (showTextboxes) {
            document.rect(left, top, width, height).stroke('lightsteelblue');
        }

        // Setup Font, Size and Color
        document.font(fontname).fontSize(fontsize).fillColor(fontcolor);

        if (typeof text === 'string') {
            var currentLineWidth = 0,
                currentLineHeight = document.currentLineHeight(true),
                currentLineIndex = result.lineIndex; // Minimal required height of the area to print 1 text line

            var maxAvailableLines = Math.floor(height / currentLineHeight); // Maximal available Lines in the current area

            // HINT: lineHeight * 2 is the minimum Height for a textline
            if (height < currentLineHeight) {
                throw new Error('The height of the content area is too small. Minmium ' + currentLineHeight + '. Given ' + height + '.');
            }

            // Variables to fit text on page
            var lastLineBreakIndex = 0, // last possible line break in the text
                lineStartIndex = 0, // a new line starts from that position
                splitIndex = -1, // The index with the end of the text for the current page. There is cut on the new page.
                lines = []; // An array containing all text lines which, adapted to the current page size

            // Calculate text thats displays correct on the current Page
            for (var charIndex = 0; charIndex < text.length; charIndex++) {
                switch (text.charAt(charIndex)) {

                // Conditional line breaks.
                case '\n':
                    lastLineBreakIndex = charIndex;
                    currentLineWidth = 0;
                    lines.push(text.slice(lineStartIndex,  charIndex).trim());
                    lineStartIndex = ++charIndex;
                    currentLineIndex++;
                    break;

                // A space is a possible line break. We check now.
                case ' ':
                    var currentWord = text.slice(lastLineBreakIndex, charIndex),
                        currentWordWidth = Math.ceil(document.widthOfString(currentWord) * 2);

                    if ((currentLineWidth + currentWordWidth) >= pixelWidth) {
                        currentLineWidth = currentWordWidth;
                        currentLineIndex++;
                        lines.push(text.slice(lineStartIndex, lastLineBreakIndex).trim());
                        lineStartIndex = ++lastLineBreakIndex;
                    } else{
                        currentLineWidth += currentWordWidth;
                    }

                    if (currentLineIndex > maxAvailableLines) {
                        splitIndex = lastLineBreakIndex;
                        break;
                    }

                    lastLineBreakIndex = charIndex;
                    break;

                default:
                // Nothing
                }

                // New line is needed, but not enough space.
                if (currentLineIndex > maxAvailableLines) {
                    splitIndex = lastLineBreakIndex;
                    break;
                }
            }

            if (splitIndex === -1) {
                // There is text thats have been not added.
                lines.push(text.slice(lineStartIndex, charIndex).trim());
            } else {
                // Cut required. Cut text and return the rest for a new page.
                result.done = false;
                result.data = text.slice(splitIndex); // Text to display on the next Page
            }

            // Add line per line to the document
            var linePositionY = top + (currentLineHeight * (result.lineIndex - 1));
            lxHelpers.forEach(lines, function(text) {
                document.text(text, left, linePositionY, format);
                linePositionY += currentLineHeight;
            });

            // Last Line with Content? ;)
            result.lineIndex = ++currentLineIndex;
        }

        // Show list
        if (typeof text === 'object') {
            document.list(text, left, top, format);
        }

        return result;
    }

//    function addTableToPage(sectionname, tableData) {
//        var data = getValue('options.sections.' + sectionname, undefined);
//
//        if (! data) {
//            console.log('ERROR: Section "' + sectionname + '" not found...');
//            return false;
//        }
//
//        var table = getValue('table', undefined, data),
//            left = getValue('format.left', 0, data),
//            top = getValue('format.top', 0, data),
//            height = getValue('format.height', 0, data),
//            width = getValue('format.width', 0, data),
////            format = getValue('format', {}, data),
//            fontname = getValue('font.name', 'Helvetica', data),
//            fontsize = getValue('font.size', 10, data),
//            fontcolor = getValue('font.color', '#000000', data);
//
//        if (showTextboxes) {
//            pdfDocument.rect(left, top, width, height).fill('lightsteelblue');
//        }
//
//        if (! table) {
//            throw new Error('No table configuration found for (' + sectionname + ')');
//        }
//
//        pdfDocument.font(fontname)
//            .fontSize(fontsize)
//            .fillColor(fontcolor);
//
//        var tableEntryHeight = 0;
//        var requiredNewPage = false;
//        var emptyColumnsHeaders = false;
//
//        for (var columnIndex in table) {
//            if ( table.hasOwnProperty(columnIndex)) {
//                var columnCaption = getValue('caption', '', table[columnIndex]),
//                    columnLeft = getValue('format.left', 0, table[columnIndex]),
//                    columnWidth = getValue('format.width', 0, table[columnIndex]),
//                    columnAlign = getValue('format.align', 'left', table[columnIndex]),
//                    headerHeight = getTextHeight(columnCaption, columnWidth) * pdfDocument.currentLineHeight(true),
//                    cellFormat = {width: columnWidth, height: height, align: columnAlign};
//
//                pdfDocument.text(columnCaption, columnLeft, top, cellFormat);
//
//                if (columnCaption === '') {
//                    emptyColumnsHeaders = true;
//                }
//
//                if (tableEntryHeight < headerHeight) {
//                    tableEntryHeight = headerHeight;
//                }
//            }
//        }
//
//        var cellPositionTop = tableEntryHeight + (pdfDocument.currentLineHeight(true) / 3);
//
//        // Line to seperate Header
//        if (!emptyColumnsHeaders) {
//            pdfDocument.moveTo(left, top + cellPositionTop).lineTo(left + width, top + cellPositionTop).stroke();
//        }
//
//        cellPositionTop += (pdfDocument.currentLineHeight(true) / 3);
//
//        for (var tableEntryIndex = 0; tableEntryIndex < tableData.length; tableEntryIndex++) {
//            if (! tableData.hasOwnProperty(tableEntryIndex)) {
//                continue;
//            }
//
//            var tableEntryData = tableData[tableEntryIndex];
//            tableEntryHeight = 0;
//
//            for (var columnIndexB = 0; columnIndexB < table.length; columnIndexB++) {
//                if (columnIndexB >= tableEntryData.length) {
//                    break;
//                }
//
//                var cellWidth = getValue('format.width', 0, table[columnIndexB]),
//                    textHeight = getTextHeight(tableEntryData[columnIndexB], cellWidth) * pdfDocument.currentLineHeight(true);
//
//                if (cellPositionTop + textHeight > height) {
//                    requiredNewPage = true;
//                    break;
//                }
//
//                if (tableEntryHeight < textHeight) {
//                    tableEntryHeight = textHeight;
//                }
//            }
//
//            // New Page required. cut and return text
//            if (requiredNewPage) {
//                return tableData.slice(tableEntryIndex);
//            }
//
//            for (var columnIndexC = 0; columnIndexC < table.length; columnIndexC++) {
//                var cellLeft = getValue('format.left', 0, table[columnIndexC]),
//                    cellWidthB = getValue('format.width', 0, table[columnIndexC]),
//                    cellAlign = getValue('format.align', 'left', table[columnIndexC]),
//                    cellHeight = tableEntryHeight,
//                    cellFormatB = {width: cellWidthB, height: height - cellHeight, align: cellAlign};
//
//                if (columnIndexC >= tableEntryData.length) {
//                    break;
//                }
//
//                pdfDocument.text(tableEntryData[columnIndexC], cellLeft, top + cellPositionTop, cellFormatB);
//            }
//
//            cellPositionTop += tableEntryHeight;
//        }
//
//        return true;
//    }

    /**
     * Add Data to Section
     *
     * @param sectionName
     * @param sectionData
     * @returns {boolean}
     */
    function addSectionData(sectionName, sectionData) {
        if (!documentData.hasOwnProperty(sectionName)) {
            documentData[sectionName] = [];
        }

        if (documentData.hasOwnProperty(sectionName)) {
            // Add Section Data
            documentData[sectionName].push(sectionData);
            return true;
        }

        return false;
    }
    // public

    /**
     * Loads a JSON Template file from disc. Returns false if fail
     *
     * @param {String} filename
     * @return Boolean
     */
    pub.loadTemplate = function(filename) {
        try {
            var data = filestream.readFileSync(filename, 'utf8').toString();
            documentTemplateData = JSON.parse(data);
            pageIndex = 0;
        } catch (error) {
            return false;
        }

        showTextboxes = getValue('debug', false);
        return true;
    };

    /**
     * Add Content to the current Page
     *
     * @param {String} name
     * @param {String|Array} data
     * @param {int} [index]
     * @return Boolean|String|Array
     */
    pub.addContent = function(name, data, index) {
        var sectionData = {
            text: data,
            page: index || 0
        };

        return addSectionData(name, sectionData);
    };

    /**
     * Add a Image
     *
     * @param name
     * @param fileName
     * @param x
     * @param y
     * @param options
     * @param index
     * @returns {boolean}
     */
    pub.addImage = function(name, fileName, x, y, options, index) {
        var sectionData = {
            image: {
                filename: fileName,
                x: x,
                y: y,
                options: options
            },
            page: index || 0
        };

        return addSectionData(name, sectionData);
    };


    /**
     * Build Table from given Data
     *
     * @param {String} sectionname
     * @param {Array} tableData
     * @param {Boolean} [autoNewPage]
     * @returns Boolean|Array
     */
//    pub.addTable = function(sectionname, tableData, autoNewPage) {
//        if (autoNewPage === true) {
//            while (typeof (tableData = addTableToPage(sectionname, tableData)) === 'object') {
//                newPage();
//            }
//            return tableData;
//        } else {
//            return addTableToPage(sectionname, tableData);
//        }
//    };

    /**
     * Save PDF Document to file
     *
     * @param {String} filename
     * @param {Function} next
     */
//    pub.save = function(filename, next) {
//        pdfDocument.write(filename, next);
//    };

    /**
     * Returns RAW PDF Document
     *
     * @param {Function} next
     */
//    pub.print = function(next) {
//        return pdfDocument.output(next);
//    };

    /**
     *
     * @param filename
     * @param next
     */
    pub.render = function(filename, next) {
        pageIndex = 0;

        // Get the page setting for page 0 and create the pdf document
        var currentPageSettings = getValue('options.layout', {}),
            currentPDFDocument = new PDFDocument(currentPageSettings);

        // Set background an other things for page 1
        setUpPage(currentPDFDocument);

        // Fill document with content
        lxHelpers.forEach(documentData, function(sectionName, sectionData) {
            var sectionInfo = {lineIndex: 0, pageIndex: 0};

            lxHelpers.forEach(sectionData, function(entry) {
                var contentPageIndex = 0;

                // If content for a special Page?
                if (entry.hasOwnProperty('page')) {
                    contentPageIndex = entry.page;
                }

                // Has the current Section already content AND a new page may be created, then use them
                if (sectionInfo.pageIndex > contentPageIndex) {
                    contentPageIndex = sectionInfo.pageIndex;
                }

                // First, get the Page for the Content. Is Page not exists, then create the Pages.
                setPage(currentPDFDocument, contentPageIndex);

                // Add text or list content
                if (entry.text) {
                    sectionInfo.data = entry.text;

                    // Add content to page
                    while (true) {
                        sectionInfo = addContentToDocument(currentPDFDocument, sectionName, sectionInfo);

                        // All content a added to document from this section, then break
                        if (sectionInfo.done) {
                            break;
                        }

                        // Create a new Page to add the rest of the content
                        console.log('New Page Required');
                        setPage(currentPDFDocument, ++contentPageIndex);
                        sectionInfo.lineIndex = 0; // New Page, reset Line
                    }
                }

                sectionInfo = {
                    lineIndex: sectionInfo.lineIndex,
                    pageIndex: sectionInfo.pageIndex
                };
            });
        });

        console.log('Document has ' + currentPDFDocument.pages.length + ' Pages!');
        currentPDFDocument.write(filename, next);
    };

    return pub;
};