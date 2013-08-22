'use strict';

var PDFDocument = require('pdfkit'),
    FileStream = require('fs');

module.exports = function (filename) {
    var pub = {},
        pdfDocument = new PDFDocument(),
        templateData = {},
        pageIndex = 0,
        showTextboxes = false;

    /*
        Returns the value from DATA with KEYNAME. If KEYNAME not exist in DATA, then returns DEFAULTVALUE.
     */
     function getValue(keyname, defaultvalue, data) {
        var keys = keyname.split('.');
        defaultvalue = (typeof defaultvalue === 'undefined' ? undefined : defaultvalue);
        data = data || templateData;

        for (var key in keys) {
            if (keys.hasOwnProperty(key)) {
                // Has Key a Page Array, take the current Page from Page Index
                if (data['pages'] && getIsArray(data['pages'])) {
                    data = data['pages'];

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
        return getValue(keyname, undefined, data) != undefined;
    }

    /**
     * Set Page Background
     */
    function setBackground() {
        var pageBGOptions = getValue('options.background');

        if (pageBGOptions && getKeyExist('filename', pageBGOptions)) {
            pdfDocument.image(getValue('filename', undefined, pageBGOptions), 0, 0, getValue('imageformat', {}, pageBGOptions));
        }
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
    function getTextHeight(text, maxWidth) {
        if (!text) {
            return 0;
        }

        var textList = text.split('\n'),
            textWidth,
            wrapLines = 0;

        for (var textItem in textList) {
            if (textList.hasOwnProperty(textItem)) {
                textWidth = Math.ceil(pdfDocument.widthOfString(textList[textItem]));

                if (textWidth > maxWidth) {
                    wrapLines += Math.round(textWidth / maxWidth);
                }
            }
        }

        return parseInt(textItem, 10) + 1 + parseInt(wrapLines, 10);
    }

    /*
        Adds content TEXT to SECTIONNAME on the current page
     */
    function addContentToPage(sectionname, text) {
        var data = getValue('options.sections.' + sectionname, undefined);

        if (! data) {
            console.log('ERROR: Section "' + sectionname + '" not found...');
            return false;
        }

        // Get some informations
        var left = getValue('format.left', 0, data),
            top = getValue('format.top', 0, data),
            height = getValue('format.height', 0, data),
            width = getValue('format.width', 0, data),
            format = getValue('format', {}, data),
            fontname = getValue('font.name', 'Helvetica', data),
            fontsize = getValue('font.size', 10, data),
            fontcolor = getValue('font.color', '#000000', data),
            pixelWidth = width * 2.0,
            result = true;

        // If DEBUG, fill Contentsection with backgroundcolor
        if (showTextboxes) {
            pdfDocument.rect(left, top, width, height).fill('lightsteelblue');
        }

        // Setup Font, Size and Color
        pdfDocument.font(fontname)
            .fontSize(fontsize)
            .fillColor(fontcolor);

        if (typeof text === 'string') {
            var wordList = text.split(" "), // Build an array from the words
                minHeight = pdfDocument.currentLineHeight(true) * 2, // Minimal required height of the area to print 1 text line
                maxAvailableLines = Math.floor(height / minHeight); // Maximal avaiable Lines in the current area

            // HINT: lineHeight * 2 is the minimum Height for a textline
            if (height < minHeight) {
                throw new Error('The height of the content area (' + sectionname + ') is too small. Minmium ' + minHeight + '. Given ' + height + '.');
            }

            // Variables to fit text on page
            var currentLineIndex = 1,
                currentLineWidth = 0,
                lastLineBreakIndex = 0,
                splitIndex = -1;

            // Calculate text thats displays correct on the current Page
            for (var charIndex in text) {
                if (text.hasOwnProperty(charIndex)) {
                    var intCharIndex = parseInt(charIndex, 10);
                    switch (text.charAt(charIndex)) {
                        case "\n":
                            lastLineBreakIndex = intCharIndex;
                            currentLineWidth = 0;
                            currentLineIndex++;
                            break;

                        case " ":
                            var currentWord = text.slice(lastLineBreakIndex, intCharIndex),
                                currentWordWidth = Math.ceil(pdfDocument.widthOfString(currentWord));

                            if ((currentLineWidth + currentWordWidth) >= pixelWidth) {
                                currentLineWidth = currentWordWidth;
                                currentLineIndex++;
                            } else{
                                currentLineWidth += currentWordWidth;
                            }

                            if (currentLineIndex > maxAvailableLines) {
                                splitIndex = lastLineBreakIndex;
                                break;
                            }

                            lastLineBreakIndex = intCharIndex;
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
            }

            // Cut required. Cut text and return the rest for a new page.
            if (splitIndex != -1) {
                result = text.slice(splitIndex); // Text to display on the next Page
                text = text.slice(0, splitIndex); // Text to display on the current Page
            }

            pdfDocument.text(text, left, top, format);
        }

        // Show list
        if (typeof text === 'object') {
            pdfDocument.list(text, left, top, format);
        }

        return result;
    }

    function addTableToPage(sectionname, tableData) {
        var data = getValue('options.sections.' + sectionname, undefined);

        if (! data) {
            console.log('ERROR: Section "' + sectionname + '" not found...');
            return false;
        }

        var table = getValue('table', undefined, data),
            left = getValue('format.left', 0, data),
            top = getValue('format.top', 0, data),
            height = getValue('format.height', 0, data),
            width = getValue('format.width', 0, data),
            format = getValue('format', {}, data),
            fontname = getValue('font.name', 'Helvetica', data),
            fontsize = getValue('font.size', 10, data),
            fontcolor = getValue('font.color', '#000000', data);

        if (showTextboxes) {
            pdfDocument.rect(left, top, width, height).fill('lightsteelblue');
        }

        if (! table) {
            throw new Error('No table configuration found for (' + sectionname + ')');
        }

        pdfDocument.font(fontname)
            .fontSize(fontsize)
            .fillColor(fontcolor);

        var tableEntryHeight = 0;
        var requiredNewPage = false;
        var emptyColumnsHeaders = false;

        for (var columnIndex in table) {
            if ( table.hasOwnProperty(columnIndex)) {
                var columnCaption = getValue('caption', '', table[columnIndex]),
                    columnLeft = getValue('format.left', 0, table[columnIndex]),
                    columnWidth = getValue('format.width', 0, table[columnIndex]),
                    columnAlign = getValue('format.align', 'left', table[columnIndex]),
                    headerHeight = getTextHeight(columnCaption, cellWidth) * pdfDocument.currentLineHeight(true),
                    cellFormat = {width: columnWidth, height: height, align: columnAlign};

                pdfDocument.text(columnCaption, columnLeft, top, cellFormat);

                if (columnCaption === '') {
                    emptyColumnsHeaders = true;
                }

                if (tableEntryHeight < headerHeight) {
                    tableEntryHeight = headerHeight;
                }
            }
        }

        var cellPositionTop = tableEntryHeight + (pdfDocument.currentLineHeight(true) / 3);

        // Line to seperate Header
        if (!emptyColumnsHeaders) {
            pdfDocument.moveTo(left, top + cellPositionTop).lineTo(left + width, top + cellPositionTop).stroke();
        }

        cellPositionTop += (pdfDocument.currentLineHeight(true) / 3);

        for (var tableEntryIndex in tableData) {
            if (! tableData.hasOwnProperty(tableEntryIndex)) {
                continue;
            }

            var tableEntryData = tableData[tableEntryIndex];
            tableEntryHeight = 0;

            for (var columnIndex in table) {
                if (! table.hasOwnProperty(columnIndex)) {
                    continue
                }

                if (columnIndex >= tableEntryData.length) {
                    break;
                }

                var cellWidth = getValue('format.width', 0, table[columnIndex]);
                var textHeight = getTextHeight(tableEntryData[columnIndex], cellWidth) * pdfDocument.currentLineHeight(true);

                if (cellPositionTop + textHeight > height) {
                    requiredNewPage = true;
                    break;
                }

                if (tableEntryHeight < textHeight) {
                    tableEntryHeight = textHeight;
                }
            }

            // New Page required. cut and return text
            if (requiredNewPage) {
                return tableData.slice(tableEntryIndex);
            }

            for (var columnIndex in table) {
                if (table.hasOwnProperty(columnIndex)) {
                    var cellLeft = getValue('format.left', 0, table[columnIndex]),
                        cellWidth = getValue('format.width', 0, table[columnIndex]),
                        cellAlign = getValue('format.align', 'left', table[columnIndex]),
                        cellHeight = tableEntryHeight,
                        cellFormat = {width: cellWidth, height: height - cellHeight, align: cellAlign};

                    if (columnIndex >= tableEntryData.length) {
                        break;
                    }

                    pdfDocument.text(tableEntryData[columnIndex], cellLeft, top + cellPositionTop, cellFormat);
                }
            }

            cellPositionTop += tableEntryHeight;
        }

        return true;
    }

    function newPage() {
        pageIndex += 1;
        var pageSettings = getValue('options.layout', {});
        pdfDocument.addPage(pageSettings);
        setBackground();
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
            var data = FileStream.readFileSync(filename, 'utf8').toString();
            templateData = JSON.parse(data);
            pageIndex = 0;
        } catch (error) {
            return false;
        }

        var pageSettings = getValue('options.layout', {});
        showTextboxes = getValue('debug', false);

        pdfDocument = new PDFDocument(pageSettings);
        setBackground();
        return true;
    };

    /**
     * Add Content to the current Page
     *
     * @param {String} sectionname
     * @param {String} text
     * @param {Boolean} [autoNewPage]
     * @return Boolean|String
     */
    pub.addContent = function(sectionname, text, autoNewPage) {
        if (autoNewPage === true) {
            while (typeof (text = addContentToPage(sectionname, text)) === 'string') {
                newPage();
            }
            return text;
        } else {
            return addContentToPage(sectionname, text);
        }
    };

    /**
     * Build Table from given Data
     *
     * @param {String} sectionname
     * @param {Array} tableData
     * @param {Boolean} [autoNewPage]
     * @returns Boolean|Array
     */
    pub.addTable = function(sectionname, tableData, autoNewPage) {
        if (autoNewPage === true) {
            while (typeof (tableData = addTableToPage(sectionname, tableData)) === 'object') {
                newPage();
            }
            return tableData;
        } else {
            return addTableToPage(sectionname, tableData);
        }
    };

    /**
     * Creates a new Page
     */
    pub.addPage = function() {
        newPage();
    };

    /**
     * Returns current Page Index
     *
     * @returns {number}
     */
    pub.getPageIndex = function() {
        return pageIndex + 1;
    };

    /**
     * Save PDF Document to file
     *
     * @param {String} filename
     * @param {Function} next
     */
    pub.save = function(filename, next) {
        pdfDocument.write(filename, next);
    };

    /**
     * Returns RAW PDF Document
     *
     * @param {Function} next
     */
    pub.print = function(next) {
        return pdfDocument.output(next);
    };

    /**
     * Add Imagefile to Document
     *
     * @param fileName
     * @param x
     * @param y
     * @param text
     * @param options
     */
    pub.addImage = function(fileName, x, y, text, options) {
        pdfDocument.image(fileName, x, y, options).text(text, x, y-25);
    };

    return pub;
};