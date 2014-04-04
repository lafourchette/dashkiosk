'use strict';

var PORTS = {
  express: 9400 || process.env.PORT,
  livereload: 31452,
  inspector: 9401
};

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({

    // Debugging with node inspector
    'node-inspector': {
      custom: {
        options: {
          'web-host': 'localhost',
          'web-port': PORTS.inspector
        }
      }
    },

    nodemon: {
      debug: {
        script: 'server.js',
        args: [ '--environment', 'development',
                '--port', PORTS.express ],
        options: {
          watch: [
            'server.js', 'lib/*'
          ],
          nodeArgs: ['--debug'],
          env: {
            LIVERELOAD_PORT: PORTS.livereload
          },
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });
            nodemon.on('restart', function () {
              setTimeout(function() {
                require('fs').writeFileSync('.rebooted', 'rebooted');
              }, 1000);
            });
          }
        }
      }
    },


    // Watching changes
    watch: {
      html: {
        files: [ 'app/*.html' ],
        tasks: [ 'build:html' ]
      },
      templates: {
        files: [ 'app/views/*.html' ],
        tasks: [ 'build:templates' ]
      },
      styles: {
        files: [ 'app/styles/{,*/}*.less' ],
        tasks: [ 'build:styles' ]
      },
      images: {
        files: [ 'app/images/{,*/,*/*/}*.*' ],
        tasks: [ 'build:images' ]
      },
      fonts: {
        files: [ 'app/fonts/*.{ttf,otf}' ],
        tasks: [ 'build:fonts' ]
      },
      scripts: {
        files: [ 'app/scripts/{,*/}*.js' ],
        tasks: [ 'build:scripts' ]
      },
      livereload: {
        options: {
          livereload: PORTS.livereload
        },
        files: [
          'build/*.html',
          'build/styles/*.css',
          'build/images/{,*/,*/*/}*.*',
          'build/fonts/*.{ttf,otf}',
          'build/scripts/{,*/}*.js' // Including templates
        ]
      },
      server: {           // nodemon will write this file
        files: [ '.rebooted' ],
        tasks: [ 'newer:jshint:server' ],
        options: {
          livereload: true
        }
      },
      test: {
        files: [ 'test/**/*.js' ],
        tasks: [ 'test' ]
      }
    },

    // Cleaning
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [ 'dist/*', '.tmp' ]
        }]
      },
      build: {
        files: [{
          dot: true,
          src: [ 'build/*' ]
        }]
      }
    },

    // lint
    jshint: {
      options: {
        reporter: require('jshint-stylish'),
        jshintrc: '.jshintrc'
      },
      server: {
        options: {
          jshintrc: 'lib/.jshintrc'
        },
        src: [ 'lib/**/*.js' ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: [ 'test/**/*.js' ]
      },
      all: [
        'Gruntfile.js',
        'app/scripts/{,*/}*.js'
      ]
    },

    // recess
    recess: {
      options: {
        noOverqualifying: false
      },
      all: {
        src: [ 'app/styles/*.less' ]
      }
    },


    // Transform less files
    less: {
      build: {
        files: [{
          expand: true,
          cwd: 'app/styles',
          src: [ '*.less' ],
          dest: 'build/styles',
          ext: '.css'
        }]
      }
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: [ 'last 2 versions', 'iOS >= 6' ]
      },
      build: {
        files: [{
          expand: true,
          cwd: 'build/styles/',
          src: '*.css',
          dest: 'build/styles/'
        }]
      }
    },

    // Rename files for browser caching purposes
    rev: {
      dist: {
        files: {
          src: [
            'dist/public/scripts/{,*/}*.js',
            'dist/public/styles/*.css',
            'dist/public/fonts/*.{ttf,otf}',
            'dist/public/images/{,*/,*/*/}*.*'
          ]
        }
      }
    },

    // Perform rewrites based on rev
    useminPrepare: {
      html: 'build/*.html',
      options: {
        dest: 'dist/public'
      }
    },
    usemin: {
      html: [ 'dist/public/*.html' ],
      css:  [ 'dist/public/styles/*.css' ],
      options: {
        assetsDirs: [ 'dist/public', 'dist/public/images', 'dist/public/fonts' ]
      }
    },

    // Image minification
    imagemin: {
      options: {
        cache: false
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'build/images',
          src: '{,*/,*/*/}*.(png|jpg|gif)',
          dest: 'dist/public/images'
        }]
      }
    },
    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: 'build/images',
          src: '{,*/,*/*/}*.svg',
          dest: 'dist/public/images'
        }]
      }
    },

    // Prepare Angular files to be minified
    ngmin: {
      build: {
        files: [{
          expand: true,
          cwd: 'build/scripts',
          src: '{,*/}*.js',
          dest: 'build/scripts'
        }]
      }
    },

    // Build templates
    ngtemplates: {
      options: {
        module: 'dashkiosk'
      },
      build: {
        cwd: 'app/views',
        src: '*.html',
        dest: 'build/scripts/views.js'
      }
    },

    concurrent: {
      server: {
        tasks: [
          'node-inspector',
          'nodemon',
          'watch'
        ],
        options: {
          limit: 3,
          logConcurrentOutput: true
        }
      }
    },

    // Server side tests with mocha
    mochaTest: {
      server: {
        options: {
          reporter: 'spec',
          require: 'test/blanket'
        },
        src: ['test/**/*.js']
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          quiet: true,
          captureFile: 'coverage.html'
        },
        src: ['test/**/*.js']
      }
    },


    // Copy files
    copy: {
      html: {
        files: [{
          expand: true,
          cwd: 'app',
          dest: 'build',
          src: [ '*.html' ]
        }]
      },
      scripts: {
        files: [{
          expand: true,
          cwd: 'app',
          dest: 'build',
          src: [
            'scripts/{,*/}*.js'
          ]
        }]
      },
      images: {
        files: [{
          expand: true,
          cwd: 'app',
          dest: 'build',
          src: [
            'images/{,*/}*.*'
          ]
        }]
      },
      fonts: {
        files: [{
          expand: true,
          cwd: 'app',
          dest: 'build',
          src: [
            'fonts/*.{ttf,otf}'
          ]
        }]
      },
      bower: {
        files: [{
          expand: true,
          cwd: 'app',
          dest: 'build',
          src: [
            'bower_components/**/*'
          ]
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'build',
          dest: 'dist/public',
          src: [
            '*.html',
            'fonts/*.{ttf,otf}'
          ]
        }, {
          expand: true,
          dest: 'dist',
          src: [
            'package.json',
            'server.js',
            'lib/**/*'
          ]
        }]
      }
    }

  });

  grunt.registerTask('serve', [
    'build',
    'concurrent:server'
  ]);

  grunt.registerTask('build', function(target) {
    switch (target) {
    case 'html':
      grunt.task.run('copy:html');
      break;
    case 'templates':
      grunt.task.run('ngtemplates:build');
      break;
    case 'styles':
      grunt.task.run('recess', 'less:build', 'autoprefixer:build');
      break;
    case 'scripts':
      grunt.task.run('jshint', 'copy:scripts', 'ngmin:build');
      break;
    case 'images':
      grunt.task.run('copy:images');
      break;
    case 'fonts':
      grunt.task.run('copy:fonts');
      break;
    case 'server':
      grunt.task.run('jshint:server');
      break;
    case undefined:
      grunt.task.run(
        'clean:build',
        'copy:bower',
        'build:html',
        'build:templates',
        'build:styles',
        'build:scripts',
        'build:images',
        'build:fonts',
        'build:server'
      );
      break;
    default:
      grunt.util.error('unknown target ' + target + ' for build');
    }
  });

  grunt.registerTask('dist', [
    'clean:dist',
    'build',
    'test',
    'useminPrepare',
    'imagemin',
    'svgmin',
    'copy:dist',
    'concat',
    'cssmin',
    'uglify',
    'rev',
    'usemin'
  ]);

  grunt.registerTask('test', [
    'jshint:test',
    'mochaTest'
  ]);

  grunt.registerTask('default', [
    'dist'
  ]);
};
