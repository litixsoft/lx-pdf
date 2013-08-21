/*global describe, it, expect, waits*/
'use strict';

var sut = require('../lib/lx-pdf.js')('');

describe('lx-pdf', function () {
    it('should be initialized correctly', function () {
        expect(sut).toBeDefined();
        expect(typeof sut.loadTemplate).toBe('function');
        expect(typeof sut.addContent).toBe('function');
        expect(typeof sut.addTable).toBe('function');
        expect(typeof sut.addPage).toBe('function');
        expect(typeof sut.getPageIndex).toBe('function');
        expect(typeof sut.save).toBe('function');
        expect(typeof sut.print).toBe('function');
        expect(typeof sut.addImage).toBe('function');
    });

    it('should be loads a template', function() {
        expect(sut.loadTemplate('nonexistfile.json')).toBeFalsy();
        expect(sut.loadTemplate('test/templates/template.json')).toBeTruthy();
    });

    it('add some content', function() {
        expect(sut.getPageIndex()).toBe(1);
        expect(sut.addContent('address', 'AAA BBB\nCCC 08\nDDDDD EEEEEE')).toBeTruthy();
        expect(sut.addContent('linebreak', 'This text is too width. And should be automatic break.')).toBeTruthy();

        expect(function() {
            sut.addContent('toosmall', 'Height is too small!');
        }).toThrow();

        expect(sut.addContent('date', '31.12.1234')).toBeTruthy();
        expect(sut.addContent('subject', 'Small Test')).toBeTruthy();


        // add Table Data
        expect(sut.addTable('tablecontent', [0, 1, 2, 3])).toBeFalsy();
        expect(function() {
            sut.addTable('content', [0, 1, 2, 3]);
        }).toThrow();
        expect(sut.addTable('table', [0, 1, 2, 3])).toBeTruthy();

        sut.addPage();
        expect(sut.getPageIndex()).toBe(2);
        expect(sut.addContent('address', 'There is no Address Section for Page 2')).toBeFalsy();
        expect(sut.addContent('content', 'Content for Page 2')).toBeTruthy();
        sut.addPage();
        expect(sut.getPageIndex()).toBe(3);
        expect(sut.addContent('content', 'The same areas on page 3+.')).toBeTruthy();

        sut.save('Dummy.pdf', function(result) {
            expect(result).toBeNull();
        });

        waits(1000);
    });
});