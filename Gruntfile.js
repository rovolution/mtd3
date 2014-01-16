/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    // Task configuration.
    uglify: {
      production: {
        src: 'src/mtd3.js',
        dest: 'dist/mtd3.min.js'
      }
    },
    jshint: {
      options: {
        curly: false,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          d3 : true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      mtd3 : {
        src: 'src/mtd3.js'
      }
    },
    less : {
      development: {
        files: [{
          src : "styles/mtd3.less",
          dest : "styles/mtd3.css"
        }]
      },
      production: {
        options: {
          compress: true,
          yuicompress: true
        },
        files: [{
          src : '<%= less.development.files[0].src %>',
          dest : 'dist/mtd3.css',
        }]
      }
    },
    connect: {
      server: {
        options: {
          port: 9001
        }
      }
    },
    open : {
      development : {
        path: 'http://127.0.0.1:<%= connect.server.options.port %>'
      }
    },
    watch: {
      jshint : {
        files: '<%= jshint.mtd3.src %>',
        tasks: ['jshint']
      },
      less: {
        files: '<%= less.development.files[0].src %>',
        tasks: ['less:development']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Default task.
  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('development', ['less:development', 'connect','open:development','watch']);
  grunt.registerTask('production', ['jshint','uglify:production','less']);
  
};