'use strict';

module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshintFiles: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
        clean: {
            jasmine: ['build/jasmine'],
            lint: ['build/lint'],
            coverage: ['build/coverage']
        },
        jshint: {
            options: {
                bitwise: true,
                curly: true,
                eqeqeq: true,
                forin: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                noempty: true,
                nonew: true,
                regexp: true,
                undef: true,
                unused: true,
                indent: 4,
                quotmark: 'single',
                loopfunc: true,
                browser: true,
                node: true,
                globals: {
                }
            },
            test: '<%= jshintFiles %>',
            jslint: {
                options: {
                    reporter: 'jslint',
                    reporterOutput: 'build/lint/jshint.xml'
                },
                files: {
                    src: '<%= jshintFiles %>'
                }
            },
            checkstyle: {
                options: {
                    reporter: 'checkstyle',
                    reporterOutput: 'build/lint/jshint_checkstyle.xml'
                },
                files: {
                    src: '<%= jshintFiles %>'
                }
            }
        },
        bgShell: {
            coverage: {
                cmd: 'node node_modules/istanbul/lib/cli.js cover --dir build/coverage node_modules/grunt-jasmine-node/node_modules/jasmine-node/bin/jasmine-node -- test --forceexit'
            },
            cobertura: {
                cmd: 'node node_modules/istanbul/lib/cli.js report --root build/coverage --dir build/coverage/cobertura cobertura'
            }
        },
        open: {
            file: {
                path: 'build/coverage/lcov-report/index.html'
            }
        },
        jasmine_node: {
            specNameMatcher: './*.spec', // load only specs containing specNameMatcher
            projectRoot: 'test',
            requirejs: false,
            forceExit: true,
            jUnit: {
                report: true,
                savePath: 'build/jasmine/',
                useDotNotation: true,
                consolidate: true
            }
        }
    });

    // Load tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-bg-shell');
    grunt.loadNpmTasks('grunt-open');

    // Register tasks.
    grunt.registerTask('test', ['clean:jasmine', 'jshint:test', 'jasmine_node']);
    grunt.registerTask('cover', ['clean:coverage', 'jshint:test', 'bgShell:coverage', 'open']);
    grunt.registerTask('ci', ['clean', 'jshint:jslint', 'jshint:checkstyle', 'bgShell:coverage', 'bgShell:cobertura', 'jasmine_node']);

    // Default task.
    grunt.registerTask('default', ['test']);
};