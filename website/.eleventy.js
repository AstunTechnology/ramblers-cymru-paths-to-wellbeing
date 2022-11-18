const i18n = require('eleventy-plugin-i18n');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/static/css');
  eleventyConfig.addPassthroughCopy('src/static/img');
  eleventyConfig.addPassthroughCopy('src/static/fonts');
  eleventyConfig.addPassthroughCopy({ "../map/dist/*.css": "/static/css" });
  eleventyConfig.addPassthroughCopy({ "../map/dist/*.mjs*": "/static/js" });

  eleventyConfig.addPlugin(i18n, {
    translations: {
      "Paths to Wellbeing": {
        'en': 'Paths to Wellbeing',
        'cy': 'Llywbrau i Lesiant'
      },
      "Home": {
        'en': 'Home',
        'cy': 'Hafan'
      },
      "About": {
        'en': 'About',
        'cy': 'Ynghylch'
      },
      "Map": {
        'en': 'Map',
        'cy': 'Map'
      }
    },
    fallbackLocales: {
      '*': 'en'
    }
  });

  return {
    dir: {
      input: 'src',
      output: 'dist'
    },
    markdownTemplateEngine: "njk",
  };
};
