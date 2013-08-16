/*global describe, it, expect*/
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
        expect(sut.addContent('subject', 'Small Test')).toBeTruthy();
        expect(sut.addContent('content', 'Content for Page 1')).toBeTruthy();

        sut.addPage();
        expect(sut.getPageIndex()).toBe(2);
        expect(sut.addContent('address', 'There is no Address Section for Page 2')).toBeFalsy();
        expect(sut.addContent('content', 'Content for Page 2')).toBeTruthy();

        sut.save('Dummy.pdf', function(result) {
            expect(result).toBeNull();
        });
    });

});