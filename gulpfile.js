const { src, dest, parallel, task, watch, series } = require('gulp');
var server = require("browser-sync").create();
const pug = require('gulp-pug');
var autoprefixer = require("autoprefixer");
const babel = require('gulp-babel');
var postcss = require("gulp-postcss");
var plumber = require("gulp-plumber");
var rename = require("gulp-rename");
var minifyCSS = require("gulp-csso");
var cleanTask = require('gulp-clean');
var sass = require("gulp-sass");
const concat = require('gulp-concat');
var htmlmin = require("gulp-htmlmin");
var imagemin = require("gulp-imagemin");
var uglify = require('gulp-uglify');
var run = require("run-sequence");

function html() {
  return src('source/templates/**/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(dest('build/'))
}

function images () {
  return src("source/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(dest("build/img"));
}

function css() {
  return src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(dest("build/css"))
    .pipe(minifyCSS())
    .pipe(rename("style.min.css"))
    .pipe(dest("build/css"))
    .pipe(server.stream())
}

var options = {};

function js() {
  return src('source/js/*.js', { sourcemaps: true })
    .pipe(babel({
      presets: ['@babel/env'],
      plugins: ['@babel/plugin-transform-runtime']
    }))
    .pipe(uglify(options))
    .pipe(concat('index.min.js'))
    .pipe(dest('build/js', { sourcemaps: true }))
}

function clean() {
  return src('build/', {read: false})
    .pipe(cleanTask());
}

function copy() {
  return src([
    "source/api/**",
  ], {
    base: "source"
  })
    .pipe(dest("build"));
};

task("serve", function() {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });
  
  watch("source/sass/**/*", css);
  watch("source/js/*.js", js);
  watch("source/img/*", images);
  watch("source/templates/**/*.html", html).on("change", server.reload);
});

exports.js = js;
exports.css = css;
exports.html = html;
exports.copy = copy;
exports.build = (done) => {
  series(clean, parallel(html, css, js, images, copy))(done);
};
exports.default = parallel(html, css, js, images, copy);
